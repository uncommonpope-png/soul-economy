fn main() {
    // wgpu-types uses cfg(any(webgpu, webgl)) to gate the Canvas variant
    // of SurfaceTarget. These cfg flags are set by wgpu-core's build.rs
    // when the "webgpu" or "webgl" Cargo feature is enabled, but not
    // during a plain cargo build. We ensure them here so that
    // SurfaceTarget::Canvas is available on wasm32 targets.
    //
    // Note: build.rs runs on the HOST, not the target, so we must check
    // the CARGO_CFG_TARGET_ARCH env var which reflects the target.
    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
    if target_arch == "wasm32" {
        println!("cargo:rustc-cfg=webgpu");
        println!("cargo:rustc-cfg=webgl");
    }
}
