pub fn set_scoreboard(count1: u16, count2: u16) -> Vec<u8> {
    let c1 = count1.min(999);
    let c2 = count2.min(999);
    vec![
        8,
        0,
        10,
        128,
        (c1 & 0xff) as u8,
        ((c1 >> 8) & 0xff) as u8,
        (c2 & 0xff) as u8,
        ((c2 >> 8) & 0xff) as u8,
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_set_scoreboard() {
        assert_eq!(set_scoreboard(10, 20), vec![8, 0, 10, 128, 10, 0, 20, 0]);
    }

    #[test]
    fn test_set_scoreboard_large() {
        // 999 = 0x03E7 → low=0xE7, high=0x03
        assert_eq!(
            set_scoreboard(999, 256),
            vec![8, 0, 10, 128, 0xE7, 0x03, 0x00, 0x01]
        );
    }

    #[test]
    fn test_set_scoreboard_clamp() {
        assert_eq!(
            set_scoreboard(1500, 2000),
            vec![8, 0, 10, 128, 0xE7, 0x03, 0xE7, 0x03]
        );
    }
}
