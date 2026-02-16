use crate::protocol::types::Color;

pub fn set_effect(style: u8, colors: &[Color]) -> Vec<u8> {
    let count = colors.len().clamp(2, 7);
    let mut packet = vec![
        (6 + count) as u8,
        0,
        3,
        2,
        style,
        90,
        count as u8,
    ];
    for i in 0..count {
        let c = colors.get(i).copied().unwrap_or(Color::new(255, 255, 255));
        packet.push(c.r);
        packet.push(c.g);
        packet.push(c.b);
    }
    packet
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_effect_two_colors() {
        let colors = vec![Color::new(255, 0, 0), Color::new(0, 255, 0)];
        let result = set_effect(0, &colors);
        assert_eq!(result, vec![8, 0, 3, 2, 0, 90, 2, 255, 0, 0, 0, 255, 0]);
    }

    #[test]
    fn test_set_effect_clamps_min() {
        let colors = vec![Color::new(255, 0, 0)];
        let result = set_effect(1, &colors);
        // count clamped to 2, second color defaults to white
        assert_eq!(
            result,
            vec![8, 0, 3, 2, 1, 90, 2, 255, 0, 0, 255, 255, 255]
        );
    }
}
