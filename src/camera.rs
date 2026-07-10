use glam::Mat4;

#[derive(Debug, Clone)]
pub struct Camera {
    pub eye: glam::Vec3,
    pub target: glam::Vec3,
    pub up: glam::Vec3,
    pub fov_y: f32,
    pub aspect: f32,
    pub near: f32,
    pub far: f32,
}

impl Camera {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            eye: glam::Vec3::new(0.0, 10.0, 18.0),
            target: glam::Vec3::new(0.0, 0.0, 0.0),
            up: glam::Vec3::Y,
            fov_y: std::f32::consts::FRAC_PI_4,
            aspect: width as f32 / height as f32,
            near: 0.1,
            far: 200.0,
        }
    }

    pub fn build_view_projection(&self) -> Mat4 {
        let view = Mat4::look_at_rh(self.eye, self.target, self.up);
        let proj = Mat4::perspective_rh(self.fov_y, self.aspect, self.near, self.far);
        proj * view
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        self.aspect = width as f32 / height as f32;
    }
}

pub struct CameraController {
    pub speed: f32,
    pub is_up_pressed: bool,
    pub is_down_pressed: bool,
    pub is_left_pressed: bool,
    pub is_right_pressed: bool,
}

impl CameraController {
    pub fn new(speed: f32) -> Self {
        Self {
            speed,
            is_up_pressed: false,
            is_down_pressed: false,
            is_left_pressed: false,
            is_right_pressed: false,
        }
    }

    pub fn update_camera(&self, camera: &mut Camera) {
        let forward = (camera.target - camera.eye).normalize();
        let right = forward.cross(camera.up).normalize();

        if self.is_up_pressed {
            camera.eye += forward * self.speed;
            camera.target += forward * self.speed;
        }
        if self.is_down_pressed {
            camera.eye -= forward * self.speed;
            camera.target -= forward * self.speed;
        }
        if self.is_left_pressed {
            camera.eye -= right * self.speed;
            camera.target -= right * self.speed;
        }
        if self.is_right_pressed {
            camera.eye += right * self.speed;
            camera.target += right * self.speed;
        }
    }
}