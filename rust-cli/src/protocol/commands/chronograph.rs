pub fn set_chronograph_mode(mode: u8) -> Vec<u8> {
    vec![5, 0, 9, 128, mode]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_chronograph_reset() {
        assert_eq!(set_chronograph_mode(0), vec![5, 0, 9, 128, 0]);
    }

    #[test]
    fn test_set_chronograph_start() {
        assert_eq!(set_chronograph_mode(1), vec![5, 0, 9, 128, 1]);
    }

    #[test]
    fn test_set_chronograph_pause() {
        assert_eq!(set_chronograph_mode(2), vec![5, 0, 9, 128, 2]);
    }

    #[test]
    fn test_set_chronograph_continue() {
        assert_eq!(set_chronograph_mode(3), vec![5, 0, 9, 128, 3]);
    }
}
