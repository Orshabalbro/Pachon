import React from 'react'
import Head from 'next/head'

import SettingsSidebar from '../../../components/settings/sidebar'
import Card from '../../../components/ui/card'

import { useSettings } from '../../../context/userContext'
import Button from '../../../components/ui/button'
import Link from 'next/link'
import BreadcrumbBar from '../../../components/ui/breadcrumbbar'

function KeySettings({keyConfigs, cancelKeyConfig, waitKeyConfig}) {
    const mappableButtons = ['DPadUp', 'DPadDown', 'DPadLeft', 'DPadRight', 'A', 'B', 'X', 'Y', 'View', 'Menu', 'Nexus', 'LeftShoulder', 'RightShoulder', 'LeftTrigger', 'RightTrigger', 'LeftThumb', 'RightThumb']
    // console.log('KEYS:', keyConfigs, mappableButtons)
    // keyConfigs = invert(keyConfigs)
    return <p>
        {
            mappableButtons.map(
                (btn:string) => {
                    let fullBtnText = ''

                    switch(btn){
                        case 'DPadUp':
                            fullBtnText = 'DPad Up'
                            break
                        case 'DPadDown':
                            fullBtnText = 'DPad Down'
                            break
                        case 'DPadLeft':
                            fullBtnText = 'DPad Left'
                            break
                        case 'DPadRight':
                            fullBtnText = 'DPad Right'
                            break
                        case 'LeftShoulder':
                            fullBtnText = 'Left Shoulder'
                            break
                        case 'RightShoulder':
                            fullBtnText = 'Right Shoulder'
                            break
                        case 'LeftTrigger':
                            fullBtnText = 'Left Trigger'
                            break
                        case 'RightTrigger':
                            fullBtnText = 'Right Trigger'
                            break
                        case 'LeftThumb':
                            fullBtnText = 'Left Thumbstick'
                            break
                        case 'RightThumb':
                            fullBtnText = 'Right Thumbstick'
                            break
                        default:
                            fullBtnText = btn
                            break
                    }

                    return <p key={btn}>
                        <label>{fullBtnText}</label>
                        <label style={{minWidth: 0}}>
                            <input type='text' className='text' onClick={(e) => {
                                waitKeyConfig(btn, e) 
                            }} onKeyUp={(e) => {
                                cancelKeyConfig(btn, e) 
                            }} value={keyConfigs[btn] ? 'Button: '+keyConfigs[btn] : 'None'}/>
                        </label>
                    </p>
                }
            )
        }
    </p>
}

function SettingsInput() {
    const { settings, setSettings} = useSettings()
    let gamepadButtonCallback = undefined
    const [controllerKeys, setControllerKeys] = React.useState(settings.gamepad_config.gamepad_mapping)

    React.useEffect(() => {
        const controllerInterval = setInterval(() => {
            const gamepads = navigator.getGamepads()
            for(const gamepad in gamepads){

                if(gamepads[gamepad] !== null){
                    for(const button in gamepads[gamepad].buttons){
                        if(gamepads[gamepad].buttons[button].pressed){
                            if(gamepadButtonCallback !== undefined){
                                gamepadButtonCallback(button)
                            }
                        }
                    }
                }

            }
        }, 32)

        return () => {
            clearInterval(controllerInterval)
        }
    })

    function setGamepadConfig(value){
        setSettings({
            ...settings,
            gamepad_config: {
                ...settings.gamepad_config,
                ...value,
            },
        })
    }

    function waitKeyConfig(button:string, event) {
        gamepadButtonCallback = (btn) => {
            setKeyConfig(button, {key: btn, target: event.target})
            gamepadButtonCallback = undefined
        }
    }

    function cancelKeyConfig(button:string, event) {
        if(event.key === 'Escape'){
            event.target.blur()
            gamepadButtonCallback = undefined
        }
    }

    function setKeyConfig(button:string, event) {
        let ckeys = controllerKeys
        if(ckeys === undefined) {
            ckeys = {} as any
        }


        for (const ckeysKey of Object.keys(ckeys)) {
            if(ckeys[ckeysKey] === event.key) delete ckeys[ckeysKey]
        }

        if (event.key !== 'Escape')
            ckeys[button] = event.key

        setControllerKeys(ckeys)
        event.target.blur()

        setGamepadConfig({
            ...settings,
            gamepad_mapping: ckeys,
        })
    }

    return (
        <React.Fragment>
            <Head>
                <title>Greenlight - Settings: Input</title>
            </Head>

            <SettingsSidebar>
                <BreadcrumbBar className='settings'>
                    <Link href="/settings/home">Settings</Link>
                    <Link href="/settings/input">Input</Link>
                    <Link href="/settings/input/gamepadmap">Gamepad Mappings</Link>
                </BreadcrumbBar>

                <Card>
                    <h1><Link href="/settings/input"><Button className='btn-small' label='<'></Button></Link> Gamepad Mappings</h1> 
                    <p>
                        {
                            <KeySettings keyConfigs={controllerKeys} cancelKeyConfig={cancelKeyConfig} waitKeyConfig={waitKeyConfig} />
                        }
                    </p>
                </Card>
            </SettingsSidebar>
      

        </React.Fragment>
    )
}

export default SettingsInput