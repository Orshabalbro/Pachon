import React from 'react'
import Button from './button'
import xPlayer from 'xbox-xcloud-player/dist/player'
import Loader from './loader'
import Card from './card'
import uPlot from 'uplot'
import Ipc from '../../lib/ipc'

interface StreamComponentProps {
  onDisconnect?: () => void;
  onMenu?: () => void;
  xPlayer: xPlayer;
}

function StreamComponent({
    onDisconnect,
    onMenu,
    xPlayer,
}: StreamComponentProps) {

    function performance_now_seconds() {
        return performance.now() / 1000.0
    }

    let lastMovement = 0

    const [micStatus, setMicStatus] = React.useState(false)
    const [waitingSeconds, setWaitingSeconds] = React.useState(0) // eslint-disable-line @typescript-eslint/no-unused-vars

    React.useEffect(() => {

        Ipc.onAction('streaming', 'onQueue', (event, waitingTimes) => {
            console.log('Waiting times:', waitingTimes)
            drawWaitingTimes(waitingTimes.estimatedTotalWaitTimeInSeconds)
        })

        // Gamebar menu mouse events
        const mouseEvent = () => {
            lastMovement = Date.now()
        }
        window.addEventListener('mousemove', mouseEvent)
        window.addEventListener('mousedown', mouseEvent)

        const mouseInterval = setInterval(() => {
            const gamebarElement = document.getElementById('component_streamcomponent_gamebar')
            if(gamebarElement === null){
                return
            }

            if((Date.now()-lastMovement) >= 2000){
                if(! gamebarElement.className.includes('hidden')){
                    gamebarElement.className = 'hidden'
                }

            } else {
                if(gamebarElement.className.includes('hidden')){
                    gamebarElement.className = ''
                }
            }
        }, 100)

        // Keyboard events
        const keyboardPressEvent = (e) => {
            switch(e.keyCode){
                case 126:
                    toggleDebug()
                    break
            }
        }
        window.addEventListener('keypress', keyboardPressEvent)

        // cleanup this component
        return () => {
            window.removeEventListener('mousemove', mouseEvent)
            window.removeEventListener('mousedown', mouseEvent)
            window.removeEventListener('keypress', keyboardPressEvent)
            clearInterval(mouseInterval);

        }
    }, [])



    function toggleMic(){
        if(xPlayer._channels.chat._micStream === undefined){
            xPlayer._channels.chat.startMicrophone()
            setMicStatus(true)
        } else {
            xPlayer._channels.chat.stopMicrophone()
            setMicStatus(false)
        }
    }

    function streamDisconnect(){
        document.getElementById('streamComponentHolder').innerHTML = ''

        xPlayer.destroy()
    }

    function endStream(){
        if(confirm('Are you sure you want to end your stream?')){
            document.getElementById('streamComponentHolder').innerHTML = ''
            onDisconnect()
            xPlayer.destroy()
        }
    }

    function toggleDebug(){
        xPlayer.toggleDebugOverlay()
    }

    function drawWaitingTimes(seconds){
        if(seconds !== false){
            setWaitingSeconds(seconds)

            const formattedWaitingTime = formatWaitingTime(seconds)
            const html = '<div>Estimated waiting time in queue: <span id="component_streamcomponent_waitingtimes_seconds">'+formattedWaitingTime+'</span></div>'

            document.getElementById('component_streamcomponent_waitingtimes').innerHTML = html

            const secondsInterval = setInterval(() => {
                seconds--
                setWaitingSeconds(seconds)

                if(document.getElementById('component_streamcomponent_waitingtimes') !== null){
                    document.getElementById('component_streamcomponent_waitingtimes_seconds').innerText = formatWaitingTime(seconds)
                } else {
                    clearInterval(secondsInterval)
                }

                if(seconds === 0){
                    clearInterval(secondsInterval)
                }
            }, 1000)
        }
    }

    function formatWaitingTime(rawSeconds: number): string {
        let formattedText = ''

        const hours = Math.floor(rawSeconds / 3600)
        const minutes = Math.floor((rawSeconds % 3600) / 60)
        const seconds = (rawSeconds % 3600) % 60

        if (hours > 0) {
            formattedText += hours + ' hour(s), '
        }

        if (minutes > 0) {
            formattedText += minutes + ' minute(s), '
        }

        if (seconds > 0) {
            formattedText += seconds + ' second(s).'
        }

        return formattedText
    }

    return (
        <React.Fragment>
            <div>
                <div id="streamComponentHolder">
                </div>

                <div id="component_streamcomponent_loader">
                    <Card className='padbottom'>
                        <h1>Loading...</h1>

                        <Loader></Loader>

                        <p>We are getting your stream ready...</p>
                        <p id="component_streamcomponent_connectionstatus"></p>

                        <p id="component_streamcomponent_waitingtimes"></p>
                    </Card>
                </div>

                <div id="component_streamcomponent_gamebar">
                    <div id="component_streamcomponent_gamebar_menu">
                        <div style={{
                            width: '25%',
                        }}>
                            <Button label={<span><i className="fa-solid fa-xmark"></i> End Stream</span>} title="End Stream" className='btn-cancel' onClick={ () => {
                                endStream() 
                            } }></Button> &nbsp;
                            <Button label={<span><i className="fa-solid fa-xmark"></i></span>} title="Disconnect" className='btn' onClick={ () => {
                                streamDisconnect() 
                            } }></Button>
                        </div>

                        <div style={{
                            marginLeft: 'auto',
                            marginRight: 'auto',
                        }}>
                            <Button label={ <span><i className="fa-brands fa-xbox"></i> Menu</span> } title="Open Xbox menu" onClick={ (e) => {
                                e.target.blur(); onMenu() 
                            }}></Button> &nbsp;
                            <Button label={ (micStatus === false) ? <span><i className="fa-solid fa-microphone-slash"></i> Muted</span> : <span><i className="fa-solid fa-microphone"></i> Active</span> } title={ (micStatus === false) ? 'Enable mic' : 'Disable mic' } className={ (micStatus === false) ? 'btn-cancel' : 'btn-primary' } onClick={ (e) => {
                                e.target.blur(); toggleMic() 
                            }}></Button>
                        </div>

                        <div style={{
                            marginRight: 20,
                            width: '25%',
                            textAlign: 'right',
                        }}>
                            <Button label={ <i className="fa-solid fa-bug"></i> } title="Debug" onClick={ (e) => {
                                e.target.blur(); toggleDebug() 
                            } }></Button>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default StreamComponent
