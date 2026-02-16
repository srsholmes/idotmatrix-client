use crate::protocol::types::Color;

pub fn set_time_indicator(enabled: bool) -> Vec<u8> {
    vec![5, 0, 7, 128, if enabled { 1 } else { 0 }]
}

pub fn set_clock_mode(style: u8, color: Color, visible_date: bool, hour24: bool) -> Vec<u8> {
    let flags = (style & 0x07)
        | if visible_date { 128 } else { 0 }
        | if hour24 { 64 } else { 0 };
    vec![8, 0, 6, 1, flags, color.r, color.g, color.b]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_time_indicator() {
        assert_eq!(set_time_indicator(true), vec![5, 0, 7, 128, 1]);
        assert_eq!(set_time_indicator(false), vec![5, 0, 7, 128, 0]);
    }

    #[test]
    fn test_set_clock_mode_defaults() {
        let color = Color::new(255, 255, 255);
        let result = set_clock_mode(0, color, true, true);
        // flags = 0 | 128 | 64 = 192
        assert_eq!(result, vec![8, 0, 6, 1, 192, 255, 255, 255]);
    }

    #[test]
    fn test_set_clock_mode_style3_no_date_12h() {
        let color = Color::new(255, 0, 0);
        let result = set_clock_mode(3, color, false, false);
        // flags = 3 | 0 | 0 = 3
        assert_eq!(result, vec![8, 0, 6, 1, 3, 255, 0, 0]);
    }
}
