use crate::shader::ShaderManager;
use crate::camera::Camera;
use std::sync::Arc;

fn log(msg: &str) {
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&msg.into());
    #[cfg(not(target_arch = "wasm32"))]
    println!("{msg}");
}

pub struct WgpuRenderer {
    surface: Option<wgpu::Surface<'static>>,
    device: Option<wgpu::Device>,
    queue: Option<wgpu::Queue>,
    config: Option<wgpu::SurfaceConfiguration>,
    pipeline: Option<wgpu::RenderPipeline>,
    shader_manager: Option<ShaderManager>,
    camera: Option<Camera>,
    last_error: Arc<std::sync::Mutex<Option<String>>>,
}

impl Default for WgpuRenderer {
    fn default() -> Self {
        Self {
            surface: None, device: None, queue: None, config: None, pipeline: None,
            shader_manager: None, camera: None,
            last_error: Arc::new(std::sync::Mutex::new(None)),
        }
    }
}

impl WgpuRenderer {
    pub async fn new(canvas: web_sys::HtmlCanvasElement) -> Result<Self, String> {
        // Verify canvas dimensions
        let width = canvas.width().max(1);
        let height = canvas.height().max(1);
        log(&format!("Canvas: {}x{}", width, height));

        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            dx12_shader_compiler: wgpu::Dx12Compiler::Fxc,
            gles_minor_version: wgpu::Gles3MinorVersion::Automatic,
            flags: wgpu::InstanceFlags::empty(),
        });

        let surface = instance.create_surface(wgpu::SurfaceTarget::Canvas(canvas))
            .map_err(|e| format!("surface: {e}"))?;

        // Try requesting adapter WITHOUT compatible_surface first.
        // On WebGPU the surface type from Canvas may not be recognized as
        // compatible, but any adapter works with all surfaces on WebGPU.
        let adapter = match instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: None,
            force_fallback_adapter: true,
        }).await {
            Some(a) => a,
            None => {
                log("no adapter without compatible_surface, trying with compatible_surface...");
                instance.request_adapter(&wgpu::RequestAdapterOptions {
                    power_preference: wgpu::PowerPreference::HighPerformance,
                    compatible_surface: Some(&surface),
                    force_fallback_adapter: true,
                }).await.ok_or("no adapter")?
            }
        };

        let adapter_info = adapter.get_info();
        log(&format!("Adapter: {} ({:?})", adapter_info.name, adapter_info.backend));

        let (device, queue) = adapter.request_device(
            &wgpu::DeviceDescriptor {
                label: Some("device"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_defaults(),
                memory_hints: wgpu::MemoryHints::Performance,
            }, None,
        ).await.map_err(|e| format!("device: {e}"))?;

        let capabilities = surface.get_capabilities(&adapter);
        let format = capabilities.formats.iter().copied().find(|f| matches!(f, wgpu::TextureFormat::Rgba8UnormSrgb | wgpu::TextureFormat::Bgra8UnormSrgb)).unwrap_or(capabilities.formats[0]);
        log(&format!("Surface format: {:?}, present modes: {:?}", format, capabilities.present_modes));

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format, width, height,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: wgpu::CompositeAlphaMode::Opaque,
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&device, &config);

        let shader_manager = ShaderManager::from_files("shaders/basic.vert.wgsl", "shaders/basic.frag.wgsl").await?;
        let vs_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("vs"),
            source: wgpu::ShaderSource::Wgsl(shader_manager.vertex_source().into()),
        });
        let fs_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("fs"),
            source: wgpu::ShaderSource::Wgsl(shader_manager.fragment_source().into()),
        });

        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("layout"),
            bind_group_layouts: &[],
            push_constant_ranges: &[],
        });

        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("pipeline"),
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState { module: &vs_module, entry_point: "main", compilation_options: Default::default(), buffers: &[] },
            fragment: Some(wgpu::FragmentState { module: &fs_module, entry_point: "main", compilation_options: Default::default(), targets: &[Some(wgpu::ColorTargetState { format, blend: Some(wgpu::BlendState::REPLACE), write_mask: wgpu::ColorWrites::ALL })]}),
            primitive: wgpu::PrimitiveState { topology: wgpu::PrimitiveTopology::TriangleList, strip_index_format: None, front_face: wgpu::FrontFace::Ccw, cull_mode: None, unclipped_depth: false, polygon_mode: wgpu::PolygonMode::Fill, conservative: false },
            depth_stencil: None,
            multisample: wgpu::MultisampleState { count: 1, mask: !0, alpha_to_coverage_enabled: false },
            multiview: None,
            cache: None,
        });

        let camera = Camera::new(width, height);

        // Set up uncaptured error callback to catch GPU-side errors
        let last_error: Arc<std::sync::Mutex<Option<String>>> = Arc::new(std::sync::Mutex::new(None));
        let err_sink = last_error.clone();
        device.on_uncaptured_error(Box::new(move |err| {
            let msg = format!("WGPU ERROR: {err}");
            log(&msg);
            *err_sink.lock().unwrap() = Some(msg);
        }));

        Ok(Self {
            surface: Some(surface), device: Some(device), queue: Some(queue),
            config: Some(config), pipeline: Some(pipeline),
            shader_manager: Some(shader_manager), camera: Some(camera),
            last_error,
        })
    }

    pub fn check_error(&self) -> Option<String> {
        self.last_error.lock().unwrap().take()
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        if let Some(config) = self.config.as_mut() {
            config.width = width.max(1); config.height = height.max(1);
            if let (Some(device), Some(surface)) = (self.device.as_ref(), self.surface.as_ref()) {
                surface.configure(device, config);
            }
        }
        if let Some(cam) = self.camera.as_mut() { cam.resize(width, height); }
    }

    pub fn camera_mut(&mut self) -> Option<&mut Camera> { self.camera.as_mut() }
    pub fn update_camera_buffer(&self) {}

    pub fn render(&mut self) -> Result<(), String> {
        // Check for previous GPU errors
        if let Some(err) = self.check_error() {
            return Err(err);
        }

        let surface = self.surface.as_ref().ok_or("no surface")?;
        let device = self.device.as_ref().ok_or("no device")?;
        let queue = self.queue.as_ref().ok_or("no queue")?;
        let pipeline = self.pipeline.as_ref().ok_or("no pipeline")?;

        let output = surface.get_current_texture().map_err(|e| format!("get tex: {e}"))?;
        let view = output.texture.create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor { label: Some("enc") });

        {
            let mut rp = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view, resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color { r: 1.0, g: 0.0, b: 0.0, a: 1.0 }),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None, timestamp_writes: None, occlusion_query_set: None,
            });
            rp.set_pipeline(pipeline);
            rp.draw(0..3, 0..1);
        }

        queue.submit(std::iter::once(encoder.finish()));
        output.present();

        // Check for errors after submission
        if let Some(err) = self.check_error() {
            return Err(err);
        }

        Ok(())
    }
}
