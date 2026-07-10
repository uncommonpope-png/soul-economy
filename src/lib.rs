pub use bevy_ecs::component::Component as DarkCityComponent;
pub use bevy_ecs::entity::Entity as DarkCityEntity;
pub use bevy_ecs::world::World as DarkCityWorld;
use web_time::Instant;

pub mod ecs;
pub mod renderer;
pub mod shader;
pub mod camera;
pub mod asset;
pub mod input;

use ecs::DarkCityWorldWrapper;
use renderer::WgpuRenderer;

pub struct Time {
    pub delta: f32,
    pub elapsed: f32,
    last_tick: Instant,
}

impl Default for Time {
    fn default() -> Self {
        Self {
            delta: 0.0,
            elapsed: 0.0,
            last_tick: Instant::now(),
        }
    }
}

pub trait DarkCitySystem {
    fn run(&mut self, world: &mut DarkCityWorldWrapper, time: &Time);
}

pub struct Game {
    world: DarkCityWorldWrapper,
    renderer: WgpuRenderer,
    systems: Vec<Box<dyn DarkCitySystem>>,
    time: Time,
}

impl Game {
    pub async fn new(canvas: web_sys::HtmlCanvasElement) -> Result<Self, String> {
        let renderer = WgpuRenderer::new(canvas).await?;
        Ok(Self {
            world: DarkCityWorldWrapper::new(),
            renderer,
            systems: Vec::new(),
            time: Time::default(),
        })
    }

    pub fn new_for_tests() -> Self {
        Self {
            world: DarkCityWorldWrapper::new(),
            renderer: WgpuRenderer::default(),
            systems: Vec::new(),
            time: Time::default(),
        }
    }

    pub fn add_system<S: DarkCitySystem + 'static>(&mut self, system: S) {
        self.systems.push(Box::new(system));
    }

    pub fn tick(&mut self) -> Result<(), String> {
        let now = Instant::now();
        self.time.delta = now.duration_since(self.time.last_tick).as_secs_f32();
        self.time.elapsed += self.time.delta;
        self.time.last_tick = now;

        for system in &mut self.systems {
            system.run(&mut self.world, &self.time);
        }
        self.renderer.render()
    }

    pub fn world(&self) -> &DarkCityWorldWrapper {
        &self.world
    }

    pub fn world_mut(&mut self) -> &mut DarkCityWorldWrapper {
        &mut self.world
    }

    pub fn time(&self) -> &Time {
        &self.time
    }

    pub fn renderer_mut(&mut self) -> &mut WgpuRenderer {
        &mut self.renderer
    }
}

pub struct LoggingSystem;
impl DarkCitySystem for LoggingSystem {
    fn run(&mut self, _world: &mut DarkCityWorldWrapper, _time: &Time) {
        println!("Tick triggered");
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Position(pub f32, pub f32);

impl DarkCityComponent for Position {
    const STORAGE_TYPE: bevy_ecs::component::StorageType = bevy_ecs::component::StorageType::Table;
}

// ── WASM entry point ─────────────────────────────────────────────────────
// Previously in src/main.rs — moved here so the cdylib exports the correct
// startup function. The old binary target (src/main.rs) conflicted with the
// library, causing the #[wasm_bindgen(start)] path to never execute.

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::JsCast;

#[cfg(target_arch = "wasm32")]
fn report(msg: &str) {
    let js_msg: &wasm_bindgen::JsValue = &msg.into();
    web_sys::console::log_1(js_msg);
    if let Some(win) = web_sys::window() {
        if let Some(doc) = win.document() {
            if let Some(el) = doc.get_element_by_id("error") {
                let current = el.text_content().unwrap_or_default();
                let updated = format!("{}{}\n", current, msg);
                el.set_text_content(Some(&updated));
            }
        }
    }
}

#[cfg(target_arch = "wasm32")]
fn report_error(msg: &str) {
    let js_msg: &wasm_bindgen::JsValue = &msg.into();
    web_sys::console::error_1(js_msg);
    if let Some(win) = web_sys::window() {
        if let Some(doc) = win.document() {
            if let Some(el) = doc.get_element_by_id("error") {
                let _ = el.set_attribute("style", "display:block;color:#ff4444");
                let current = el.text_content().unwrap_or_default();
                let updated = format!("{}❌ {}\n", current, msg);
                el.set_text_content(Some(&updated));
            }
        }
    }
}

#[cfg(target_arch = "wasm32")]
fn draw_2d_city(canvas: &web_sys::HtmlCanvasElement) {
    if let Ok(Some(ctx)) = canvas.get_context("2d") {
        let ctx: web_sys::CanvasRenderingContext2d = JsCast::unchecked_into(ctx);
        let w = canvas.width() as f64;
        let h = canvas.height() as f64;

        // Background
        ctx.set_fill_style_str("#0a0a1a");
        ctx.fill_rect(0.0, 0.0, w, h);

        // Title
        ctx.set_fill_style_str("#ff4488");
        ctx.set_font("bold 28px monospace");
        ctx.fill_text("Dark City Engine (2D Fallback)", 20.0, 40.0);
        ctx.set_fill_style_str("#888888");
        ctx.set_font("14px monospace");
        ctx.fill_text("WebGPU unavailable - showing 2D preview", 20.0, 70.0);

        // Buildings
        let colors = ["#ff4488","#22ddff","#ffdd44","#44ff88","#8844ff","#ff8800","#4488ff","#00ff66"];
        for x in 0..8 {
            for z in 0..8 {
                let bx = 40.0 + x as f64 * 65.0;
                let bz = h - 120.0 - z as f64 * 55.0;
                let bh = 30.0 + ((x * 7 + z * 13) % 6) as f64 * 35.0;
                let col = colors[(x * 3 + z * 7) % 8];
                ctx.set_fill_style_str(col);
                ctx.fill_rect(bx, bz - bh, 45.0, bh);
            }
        }

        // Center triangle
        ctx.set_fill_style_str("#ff44ff");
        ctx.begin_path();
        ctx.move_to(w / 2.0, 50.0);
        ctx.line_to(w / 2.0 + 100.0, h / 2.0 + 100.0);
        ctx.line_to(w / 2.0 - 100.0, h / 2.0 + 100.0);
        ctx.close_path();
        ctx.fill();
        ctx.set_fill_style_str("#ffffff");
        ctx.set_font("16px monospace");
        ctx.fill_text("MAGENTA TRIANGLE", w / 2.0 - 80.0, h / 2.0 + 110.0);

        report("2D fallback drawn");
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub async fn main_wasm() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    let _ = input::InputState::setup_event_listeners();

    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let canvas = document
        .get_element_by_id("dark_city_canvas")
        .unwrap()
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .unwrap();

    report("Dark City Engine starting...");

    let js_gpu = js_sys::Reflect::get(&window, &"gpu".into());
    match js_gpu {
        Ok(_) => report("navigator.gpu found"),
        Err(_) => report("navigator.gpu NOT found"),
    }

    report("Initializing WebGPU renderer...");
    let mut game = match Game::new(canvas.clone()).await {
        Ok(g) => {
            report("WebGPU renderer initialized!");
            g
        }
        Err(e) => {
            report_error(&format!("WebGPU init failed: {}", e));
            draw_2d_city(&canvas);
            return Ok(());
        }
    };

    if let Some(err) = game.renderer_mut().check_error() {
        report_error(&format!("GPU error after init: {}", err));
    }

    // Pointer lock on click
    let canvas2 = canvas.clone();
    let click_h = Closure::<dyn FnMut(web_sys::MouseEvent)>::new(move |_| {
        let _ = canvas2.request_pointer_lock();
    });
    canvas
        .add_event_listener_with_callback("click", click_h.as_ref().unchecked_ref())?;
    click_h.forget();

    // Main game loop
    let f = std::rc::Rc::new(std::cell::RefCell::new(None));
    let g = f.clone();
    *g.borrow_mut() = Some(Closure::new(move || {
        if let Err(e) = game.tick() {
            report_error(&format!("Render error: {}", e));
        }
        request_animation_frame(f.borrow().as_ref().unwrap());
    }));
    request_animation_frame(g.borrow().as_ref().unwrap());

    report("Game loop running");
    Ok(())
}

#[cfg(target_arch = "wasm32")]
fn request_animation_frame(f: &Closure<dyn FnMut()>) {
    web_sys::window()
        .unwrap()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .unwrap();
}

// ── Tests ─────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_entities() {
        let mut game = Game::new_for_tests();
        let entity = game.world_mut().spawn_entity();

        assert_eq!(entity.index(), 0);
    }

    #[test]
    fn adds_and_retrieves_position_component() {
        let mut game = Game::new_for_tests();
        let entity = game.world_mut().spawn_entity();
        game.world_mut().add_component(entity, Position(3.0, 4.0));

        let position = game.world().get_component::<Position>(entity);
        assert_eq!(position, Some(&Position(3.0, 4.0)));
    }

    #[test]
    fn system_executes_in_tick() {
        let mut game = Game::new_for_tests();
        game.add_system(LoggingSystem);
        game.tick().unwrap();
    }
}