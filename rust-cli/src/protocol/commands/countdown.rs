pub fn set_countdown_mode(mode: u8, minutes: u8, seconds: u8) -> Vec<u8> {
    let sec = seconds.min(59);
    vec![7, 0, 8, 128, mode, minutes, sec]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_countdown_start() {
        assert_eq!(set_countdown_mode(1, 5, 30), vec![7, 0, 8, 128, 1, 5, 30]);
    }

    #[test]
    fn test_set_countdown_clamp_seconds() {
        assert_eq!(set_countdown_mode(1, 5, 99), vec![7, 0, 8, 128, 1, 5, 59]);
    }

    #[test]
    fn test_set_countdown_disable() {
        assert_eq!(set_countdown_mode(0, 0, 0), vec![7, 0, 8, 128, 0, 0, 0]);
    }
}
