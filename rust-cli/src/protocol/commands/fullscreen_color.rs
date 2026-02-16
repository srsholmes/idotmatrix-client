use crate::protocol::types::Color;

pub fn set_fullscreen_color(color: Color) -> Vec<u8> {
    vec![7, 0, 2, 2, color.r, color.g, color.b]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_fullscreen_color() {
        let color = Color::new(255, 0, 128);
        assert_eq!(set_fullscreen_color(color), vec![7, 0, 2, 2, 255, 0, 128]);
    }
}
