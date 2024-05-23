import React from 'react'
import Head from 'next/head'

import SettingsSidebar from '../../components/settings/sidebar'
import Card from '../../components/ui/card'

import { useSettings } from '../../context/userContext'
import Button from '../../components/ui/button'
import BreadcrumbBar from '../../components/ui/breadcrumbbar'
import Link from 'next/link'

function SettingsInput() {
    const { settings, setSettings} = useSettings()
    const [ controllerPing, setControllerPing] = React.useState(0)

    React.useEffect(() => {
        console.log('Last controller check:', controllerPing)
        const controllerInterval = setInterval(() => {
            setControllerPing(Date.now())
        }, 1000)

        return () => {
            clearInterval(controllerInterval)
        }
    })

    function setControllerVibration(){
        setSettings({
            ...settings,
            controller_vibration: (! settings.controller_vibration),
        })
    }

    function setGamepadConfig(value){
        setSettings({
            ...settings,
            gamepad_config: {
                ...settings.gamepad_config,
                ...value,
            },
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
                </BreadcrumbBar>

                <Card>
                    <h1>Gamepad</h1>

                    <p>
                        <label>Enable vibration (broken)</label>
                        <label style={{ minWidth: 0 }}>
                            <input type='checkbox' onChange={ setControllerVibration } checked={settings.controller_vibration} />&nbsp; ({ settings.controller_vibration ? 'Enabled' : 'Disabled'})
                        </label>
                    </p>
                    <p>
                        <label>Enable keyboard mapping</label>
                        <label style={{ minWidth: 0 }}>
                            <input type='checkbox' onChange={ () => setGamepadConfig({ enable_keyboard: !settings.gamepad_config.enable_keyboard }) } checked={settings.gamepad_config.enable_keyboard} />&nbsp; ({ settings.gamepad_config.enable_keyboard ? 'Enabled' : 'Disabled'})
                        </label>
                    </p>
                    <p hidden={ !settings.gamepad_config.enable_keyboard }>
                        <label></label>
                        <label style={{ minWidth: 0 }}>
                            <Link href="/settings/input/keyboardmap"><Button className="btn-small" label="Configure Keyboard mappings"></Button></Link>
                        </label>
                    </p>
                    <p>
                        <label></label>
                        <label style={{ minWidth: 0 }}>
                            <Link href="/settings/input/gamepadmap"><Button className="btn-small" label="Configure Gamepad mappings"></Button></Link>
                        </label>
                    </p>
                </Card>

                <Card>
                    <h1>Touch</h1>

                    <p><i>No options yet</i></p>
                </Card>

                <Card>
                    <h1>Mouse & Keyboard</h1>

                    <p><i>No options yet</i></p>
                </Card>

                <Card>
                    <h1>Input</h1>

                    {/* <p>
                        <label>Enable Touch input</label>
                        <label style={{ minWidth: 0 }}>
                            <input type='checkbox' onChange={ setTouchInput } checked={settings.input_touch} />&nbsp; ({ settings.input_touch ? 'Enabled' : 'Disabled'})
                        </label>
                    </p>

                    <p>
                        <label>Enable Mouse & Keyboard</label>
                        <label style={{ minWidth: 0 }}>
                            <input type='checkbox' onChange={ setMKBInput } checked={settings.input_mousekeyboard} />&nbsp; ({ settings.input_mousekeyboard ? 'Enabled' : 'Disabled'})
                        </label> <br />
                        { (!settings.input_newgamepad && settings.input_mousekeyboard) ? <small style={{ color: 'orange' }}>Using the Mouse & Keyboard driver together with the Gamepad keyboard mappings will cause conflicts</small> : '' }
                    </p>

                    <p>
                        <label>Enable Keyboard to Gamepad</label>
                        <label style={{ minWidth: 0 }}>
                            <input type='checkbox' onChange={ setLegacyInput } checked={!settings.input_newgamepad} />&nbsp; ({ !settings.input_newgamepad ? 'Enabled' : 'Disabled'})
                        </label><br />
                        <small>(Disabling this feature will disable the keyboard to gamepad mapping and only allows controls from the gamepad.)</small>
                    </p> */}
                </Card>

                <Card>
                    <h1>Controllers detected</h1>

                    <p>
                        If you have a gamepad connected but it is not showing up, try to press a button on the controller to detect it.
                    </p>

                    <div>
                        {
                            navigator.getGamepads().map((item, index) => {
                                return (
                                    <p key={ index }>
                                #{ index+1 } &nbsp;

                                        { (item) ?
                                            item.id + ' axes: ' + item.axes.length + ', buttons: ' + item.buttons.length + ', rumble: ' + ((item.vibrationActuator !== null) ? item.vibrationActuator.type : 'Not supported')
                                            : 'No controller detected'
                                        }
                                    </p>
                                )
                            })
                        }
                    </div>
                </Card>
            </SettingsSidebar>
      

        </React.Fragment>
    )
}

export default SettingsInput
