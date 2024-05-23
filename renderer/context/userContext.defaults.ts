const gamepad_config = {
    enable_keyboard: true,
    keyboard_mapping: {
        'A': 'Enter',
        'B': 'Backspace',
        'X': 'x',
        'Y': 'y',
        'DPadUp': 'ArrowUp',
        'DPadDown': 'ArrowDown',
        'DPadLeft': 'ArrowLeft',
        'DPadRight': 'ArrowRight',
        'LeftShoulder': '[',
        'RightShoulder': ']',
        'LeftThumb': 'l',
        'RightThumb': 'r',
        'LeftTrigger': '-',
        'RightTrigger': '=',
        'Menu': 'm',
        'View': 'v',
        'Nexus': 'n',
    },
    gamepad_mapping: {
        'A': '0',
        'B': '1',
        'X': '2',
        'Y': '3',
        'DPadUp': '12',
        'DPadDown': '13',
        'DPadLeft': '14',
        'DPadRight': '15',
        'LeftShoulder': '4',
        'RightShoulder': '5',
        'LeftThumb': '10',
        'RightThumb': '11',
        'LeftTrigger': '6',
        'RightTrigger': '7',
        'Menu': '9',
        'View': '8',
        'Nexus': '16',
    },
    gamepad_axes_mapping: {
        'LeftThumbXAxis': '0',
        'LeftThumbYAxis': '1',
        'RightThumbXAxis': '2',
        'RightThumbYAxis': '3',
    },
    gamepad_deadzone: 0.2,
}

export const defaultSettings = {
    xhome_bitrate: 0,
    xcloud_bitrate: 0,
    video_resolution: '1080p',

    preferred_game_language: 'en-US',
    video_size: 'default',
    force_region_ip: '',
    // input_touch: false,
    // input_mousekeyboard: false,
    // input_mousekeyboard_config: {
    //     ArrowLeft: 'DPadLeft',
    //     ArrowUp: 'DPadUp',
    //     ArrowRight: 'DPadRight',
    //     ArrowDown: 'DPadDown',

    //     Enter: 'A',
    //     a: 'A',

    //     Backspace: 'B',
    //     b: 'B',

    //     x: 'X',
    //     y: 'Y',

    //     '[': 'LeftShoulder',
    //     ']': 'RightShoulder',

    //     '-': 'LeftTrigger',
    //     '=': 'RightTrigger',

    //     v: 'View',
    //     m: 'Menu',
    //     n: 'Nexus',
    // },
    // input_newgamepad: false,
    app_lowresolution: false,

    gamepad_config: gamepad_config,
    controller_vibration: true,

    video_enabled: true,
    audio_enabled: true,

    // WebUI
    webui_autostart: false,
    webui_port: 9003,
}