import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import xCloudPlayer from 'xbox-xcloud-player'
import xCloudPlayerPlayer from 'xbox-xcloud-player/dist/player'

import { useSettings } from '../../context/userContext'
import StreamComponent from '../../components/ui/streamcomponent'
import StreamPreload from '../../components/ui/streampreload'
import Ipc from '../../lib/ipc'
import Gamepad from 'xbox-xcloud-player/dist/input/gamepad'

function Stream() {
    const router = useRouter()
    const { settings } = useSettings()

    let streamStateInterval
    let keepaliveInterval

    const [xPlayer, setxPlayer] = React.useState<xCloudPlayerPlayer>(undefined)
    const [sessionId, setSessionId] = React.useState('')
    const [queueTime, setQueueTime] = React.useState(0)

    React.useEffect(() => {
        // Detect stream type and title / server id
        let streamType = 'home'
        let serverId = router.query.serverid
        if((router.query.serverid as string).substr(0, 6) === 'xcloud'){
            streamType = 'cloud'
            serverId = (router.query.serverid as string).substr(7)
        }

        if(xPlayer !== undefined){
            document.getElementById('streamComponentHolder').innerHTML = '<div id="streamComponent" class="size_'+settings.video_size+'"></div>'

            xPlayer.setChatSdpHandler((offer) => {
                Ipc.send('streaming', 'sendChatSdp', {
                    sessionId: sessionId,
                    sdp: offer.sdp,
                }).then((sdpResponse) => {
                    xPlayer.setRemoteOffer(sdpResponse.sdp)
    
                }).catch((error) => {
                    console.log('ChatSDP Exchange error:', error)
                    alert('ChatSDP Exchange error:'+ JSON.stringify(error))
                })
            })

            xPlayer.createOffer().then((offer:any) => {
                Ipc.send('streaming', 'sendSdp', {
                    sessionId: sessionId,
                    sdp: offer.sdp,
                }).then((sdpResult:any) => {
                    xPlayer.setRemoteOffer(sdpResult)

                    // Gather candidates
                    const candidates = xPlayer.getIceCandidates()
                    const iceCandidates = candidates.map((candidate) => {
                        return { candidate: candidate.candidate, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex, usernameFragment: candidate.usernameFragment }
                    })
                    const clientCandidates:Array<any> = []
                    for(const candidate in iceCandidates){
                        clientCandidates.push(JSON.stringify({
                            candidate: iceCandidates[candidate].candidate,
                            sdpMLineIndex: iceCandidates[candidate].sdpMLineIndex,
                            sdpMid: iceCandidates[candidate].sdpMid,
                        }))
                    }

                    Ipc.send('streaming', 'sendIce', {
                        sessionId: sessionId,
                        ice: clientCandidates,
                    }).then((iceResult:any) => {
                        console.log(iceResult)
                        xPlayer.setRemoteIceCandidates(iceResult)

                        let lastState = 'new'
                        xPlayer.onConnectionStateChange((state) => {
                            const connStatus = document.getElementById('component_streamcomponent_connectionstatus')
                            if(lastState !== state) {
                                lastState = state
                                switch(state){
                                    case 'new':
                                        connStatus.innerText = 'Starting connection...'
                                        break
                                    case 'connecting':
                                        connStatus.innerText = 'Connecting to console...'
                                        break
                                    case 'connected':
                                        connStatus.innerText = 'Client has been connected!'
                                        document.getElementById('component_streamcomponent_loader').className = 'hidden'

                                        // @TODO: Improve this
                                        setTimeout(() => {
                                            const gamepad = new xCloudPlayer.Gamepad(0, {
                                                enable_keyboard: settings.gamepad_config.enable_keyboard,
                                                keyboard_mapping: settings.gamepad_config.keyboard_mapping,
                                                gamepad_mapping: settings.gamepad_config.gamepad_mapping,
                                                gamepad_axes_mapping: settings.gamepad_config.gamepad_axes_mapping,
                                                gamepad_deadzone: settings.gamepad_config.gamepad_deadzone,
                                                enable_vibration: settings.controller_vibration,
                                                // gamepad_force_capture: false, // @TODO: Implement config switch
                                                
                                                // vibration: settings.controller_vibration,
                                            })
                                            gamepad.attach(xPlayer)
                                        }, 500)

                                        // Start keepalive loop
                                        keepaliveInterval = setInterval(() => {
                                            Ipc.send('streaming', 'sendKeepalive', {
                                                sessionId: sessionId,
                                            }).then((result) => {
                                                console.log('StartStream keepalive:', result)
                                            }).catch((error) => {
                                                console.error('Failed to send keepalive. Error details:\n'+JSON.stringify(error))
                                            })
                                        }, 30000) // Send every 30 seconds

                                        break

                                    case 'closed':
                                        console.log('Client has been disconnected. Returning to prev page.')
                                        xPlayer.destroy()
                                        setxPlayer(undefined)
                                        window.history.back()
                                        break
                                }
                            }
                        })
    

                    }).catch((error) => {
                        console.log('ICE Exchange error:', error)
                        alert('ICE Exchange error:'+ JSON.stringify(error))
                    })

                }).catch((error) => {
                    console.log('SDP Exchange error:', error)
                    alert('SDP Exchange error:'+ JSON.stringify(error))
                })
            })
        } else if(sessionId === '') {
            // Stream is not ready yet, lets start it...

            Ipc.send('streaming', 'startStream', {
                type: streamType,
                target: serverId,
            }).then((result:string) => {
                console.log('StartStream session:', result)
                setSessionId(result)
    
            }).catch((error) => {
                alert('Failed to start new stream. Error details:\n'+JSON.stringify(error))
            })
        } else {

            streamStateInterval = setInterval(() => {
                Ipc.send('streaming', 'getPlayerState', {
                    sessionId: sessionId,
                }).then((session:any) => {
                    console.log('Player state:', session)

                    switch(session.playerState){
                        case 'pending':
                            // Waiting for console to start
                            break

                        case 'started':
                            // Console is ready
                            clearInterval(streamStateInterval)
                            setxPlayer(new xCloudPlayer.Player('streamComponent', {
                                video_bitrate: (streamType === 'cloud') ? settings.xcloud_bitrate : settings.xhome_bitrate,
                                keyframe_interval: 0,
                            }))
                            break

                        case 'failed':
                            // Error
                            clearInterval(streamStateInterval)

                            if(session.errorDetails.code === 'WNSError' && session.errorDetails.message.includes('WaitingForServerToRegister')){
                                // Detected the "WaitingForServerToRegister" error. This means the console is not connected to the xbox servers
                                alert('Unable to start stream session on console. The console is not connected to the Xbox servers. This ocasionally happens then there is an update or when the user is not signed in to the console. Please hard reboot your console and try again.\n\n'+'Stream error result: '+session.state+'\nDetails: ['+session.errorDetails.code+'] '+session.errorDetails.message)
                            } else {
                                alert('Stream error result: '+session.state+'\nDetails: ['+session.errorDetails.code+'] '+session.errorDetails.message)
                            }
                            console.log('Full stream error:', session.errorDetails)
                            onDisconnect()
                            xPlayer.destroy()
                            break

                        case 'queued':
                            // Waiting in queue
                            // @TODO: Show queue position
                            if(queueTime === 0){
                                setQueueTime(session.waitingTimes.estimatedTotalWaitTimeInSeconds)
                                console.log('Setting queue to:', session.waitingTimes.estimatedTotalWaitTimeInSeconds)
                            }
                            break
                    }

                }).catch((error) => {
                    alert('Failed to get player state. Error details:\n'+JSON.stringify(error))
                })
            }, 1000)
        }

        // Modal window
        return () => {
            if(xPlayer !== undefined){
                xPlayer.destroy()
            }

            if(keepaliveInterval){
                clearInterval(keepaliveInterval) 
            }

            if(streamStateInterval){
                clearInterval(streamStateInterval) 
            }
        }
    })

    function gamepadSend(button){
        console.log('Pressed button:', button, xPlayer._channels.control._gamepadHandlers[0])
        // xPlayer.getChannelProcessor('input').pressButton(0, 'Nexus')
        if(xPlayer._channels.control._gamepadHandlers[0] instanceof Gamepad){
            xPlayer._channels.control._gamepadHandlers[0].sendButtonState('Nexus', 1)
            setTimeout(() => {
                if(xPlayer._channels.control._gamepadHandlers[0] instanceof Gamepad){
                    xPlayer._channels.control._gamepadHandlers[0].sendButtonState('Nexus', 0)
                }
            }, 32)
        }
    }

    function onDisconnect(){  
        Ipc.send('streaming', 'stopStream', {
            sessionId: sessionId,
        }).then((result) => {
            console.log('Stream stopped:', result)
        })

        if(streamStateInterval){
            clearInterval(streamStateInterval)
        }
    }

    return (
        <React.Fragment>
            <Head>
                <title>Greenlight - Streaming {router.query.serverid}</title>
            </Head>

            { (xPlayer !== undefined) ? <StreamComponent onDisconnect={ () => {
                onDisconnect() 
            }} onMenu={ () => {
                gamepadSend('nexus') 
            } } xPlayer={ xPlayer }></StreamComponent> : (queueTime > 0) ?<StreamPreload onDisconnect={ () => {
                onDisconnect() 
            }} waitingTime={ queueTime }></StreamPreload> : <StreamPreload onDisconnect={ () => {
                onDisconnect() 
            }}></StreamPreload> }
        </React.Fragment>
    )
}

export default Stream
