use std::path::Path;
use wasm_bindgen::JsCast;

#[derive(Debug, Clone)]
pub struct ShaderManager {
    vertex_shader: String,
    fragment_shader: String,
}

impl ShaderManager {
    pub async fn from_files(vertex_path: impl AsRef<Path>, fragment_path: impl AsRef<Path>) -> Result<Self, String> {
        let vertex_shader = Self::load_source(vertex_path.as_ref()).await?;
        let fragment_shader = Self::load_source(fragment_path.as_ref()).await?;

        Ok(Self {
            vertex_shader,
            fragment_shader,
        })
    }

    #[cfg(not(target_arch = "wasm32"))]
    async fn load_source(path: &Path) -> Result<String, String> {
        std::fs::read_to_string(path)
            .map_err(|err| format!("failed to read shader file {}: {err}", path.display()))
    }

    #[cfg(target_arch = "wasm32")]
    async fn load_source(path: &Path) -> Result<String, String> {
        let path_str = path.to_string_lossy().replace('\\', "/");
        let window = web_sys::window().ok_or_else(|| "no window available for shader loading".to_string())?;
        let response = wasm_bindgen_futures::JsFuture::from(window.fetch_with_str(&path_str))
            .await
            .map_err(|err| format!("failed to fetch shader {path_str}: {err:?}"))?;
        let response: web_sys::Response = response
            .dyn_into()
            .map_err(|_| format!("shader fetch did not return a Response for {path_str}"))?;
        let buffer = wasm_bindgen_futures::JsFuture::from(response.array_buffer().map_err(|_| format!("unable to read shader response body for {path_str}"))?)
            .await
            .map_err(|err| format!("failed to read shader bytes for {path_str}: {err:?}"))?;
        let bytes = js_sys::Uint8Array::new(&buffer);
        let bytes = bytes.to_vec();

        String::from_utf8(bytes)
            .map_err(|err| format!("shader content from {path_str} was not valid UTF-8: {err}"))
    }

    pub fn vertex_source(&self) -> &str {
        &self.vertex_shader
    }

    pub fn fragment_source(&self) -> &str {
        &self.fragment_shader
    }
}
