use crate::protocol::types::Color;

pub fn set_pixel(x: u8, y: u8, color: Color) -> Vec<u8> {
    vec![10, 0, 5, 1, 0, color.r, color.g, color.b, x, y]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_pixel() {
        let color = Color::new(0, 255, 0);
        assert_eq!(set_pixel(10, 20, color), vec![10, 0, 5, 1, 0, 0, 255, 0, 10, 20]);
    }
}
