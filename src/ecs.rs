use bevy_ecs::{entity::Entity, world::World};

pub struct DarkCityWorldWrapper {
    world: World,
}

impl DarkCityWorldWrapper {
    pub fn new() -> Self {
        Self { world: World::new() }
    }

    pub fn spawn_entity(&mut self) -> Entity {
        self.world.spawn(()).id()
    }

    pub fn add_component<C>(&mut self, entity: Entity, component: C)
    where
        C: bevy_ecs::component::Component,
    {
        self.world.entity_mut(entity).insert(component);
    }

    pub fn get_component<C>(&self, entity: Entity) -> Option<&C>
    where
        C: bevy_ecs::component::Component,
    {
        self.world.get::<C>(entity)
    }
}
