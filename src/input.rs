use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

pub struct InputState {
    pub keys_pressed: HashSet<String>,
    pub mouse_x: f32,
    pub mouse_y: f32,
    pub mouse_dx: f32,
    pub mouse_dy: f32,
}

impl InputState {
    pub fn new() -> Self {
        Self {
            keys_pressed: HashSet::new(),
            mouse_x: 0.0,
            mouse_y: 0.0,
            mouse_dx: 0.0,
            mouse_dy: 0.0,
        }
    }

    pub fn is_key_down(&self, key: &str) -> bool {
        self.keys_pressed.contains(key)
    }

    pub fn setup_event_listeners() -> Result<(), JsValue> {
        let window = web_sys::window().ok_or("no window")?;
        let document = window.document().ok_or("no document")?;

        let keydown_handler = Closure::<dyn FnMut(web_sys::KeyboardEvent)>::new(move |event: web_sys::KeyboardEvent| {
            INPUT_STATE.with(|state| {
                state.borrow_mut().keys_pressed.insert(event.key());
            });
        });
        document.add_event_listener_with_callback("keydown", keydown_handler.as_ref().unchecked_ref())?;
        keydown_handler.forget();

        let keyup_handler = Closure::<dyn FnMut(web_sys::KeyboardEvent)>::new(move |event: web_sys::KeyboardEvent| {
            INPUT_STATE.with(|state| {
                state.borrow_mut().keys_pressed.remove(&event.key());
            });
        });
        document.add_event_listener_with_callback("keyup", keyup_handler.as_ref().unchecked_ref())?;
        keyup_handler.forget();

        let mousemove_handler = Closure::<dyn FnMut(web_sys::MouseEvent)>::new(move |event: web_sys::MouseEvent| {
            INPUT_STATE.with(|state| {
                let mut s = state.borrow_mut();
                s.mouse_dx = event.movement_x() as f32;
                s.mouse_dy = event.movement_y() as f32;
                s.mouse_x = event.client_x() as f32;
                s.mouse_y = event.client_y() as f32;
            });
        });
        document.add_event_listener_with_callback("mousemove", mousemove_handler.as_ref().unchecked_ref())?;
        mousemove_handler.forget();

        Ok(())
    }

    pub fn end_frame(&mut self) {
        self.mouse_dx = 0.0;
        self.mouse_dy = 0.0;
    }
}

thread_local! {
    pub static INPUT_STATE: std::cell::RefCell<InputState> = std::cell::RefCell::new(InputState::new());
}

pub fn get_input_state() -> InputState {
    INPUT_STATE.with(|state| state.borrow().clone())
}

impl Clone for InputState {
    fn clone(&self) -> Self {
        Self {
            keys_pressed: self.keys_pressed.clone(),
            mouse_x: self.mouse_x,
            mouse_y: self.mouse_y,
            mouse_dx: self.mouse_dx,
            mouse_dy: self.mouse_dy,
        }
    }
}