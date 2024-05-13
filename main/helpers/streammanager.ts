import Stream from 'xbox-xcloud-player/dist/lib/stream'
import Application from '../application'

import ApiClient from 'xbox-xcloud-player/dist/apiclient'

export interface playResult {
    sessionPath:string;
    sessionId?:string;
    state?:string;
}

interface streamSession {
    id: string;
    target: string;
    path: string;
    type: 'home'|'cloud';
    state?: string;
    waitingTimes?: any;
    playerState: 'pending'|'started'|'queued'|'failed';
    errorDetails?: {
        code;
        message;
    };
    stream:Stream;
}

export default class StreamManager {

    _application:Application

    _xHomeApi:ApiClient
    _xCloudApi:ApiClient

    _sessions = {}
    
    constructor(application){
        this._application = application
    }

    getApi(type:'home'|'cloud'){
        if(type === 'home'){
            return this._xHomeApi !== undefined ? this._xHomeApi : this._xHomeApi = new ApiClient({
                locale: 'en-US',
                token: this._application._authentication._tokenStore.getStreamingToken('xhome').data.gsToken,
                host: 'https://'+this._application._authentication._tokenStore.getBaseUrl('xhome'),
            })
        } else {
            return this._xCloudApi !== undefined ? this._xCloudApi : this._xCloudApi = new ApiClient({
                locale: 'en-US',
                token: this._application._authentication._tokenStore.getStreamingToken('xcloud').data.gsToken,
                host: 'https://'+this._application._authentication._tokenStore.getBaseUrl('xcloud'),
            })
        }
    }

    getSession(sessionId:string):streamSession {
        return this._sessions[sessionId]
    }

    startStream(type:'home'|'cloud', target:string){
        return new Promise((resolve, reject) => {

            this.getApi('home').startStream(type, target).then((stream) => {
                console.log('Streammanager - startStream:', stream)

                const sessionId = stream.getSessionId()

                const streamSession:streamSession = {
                    id: sessionId,
                    target: target,
                    path: stream.getSessionPath(),
                    type: type,
                    playerState: 'pending',
                    stream: stream,
                }
                this._sessions[sessionId] = streamSession
                this.monitorSession(sessionId)

                resolve(sessionId)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    stopStream(sessionId){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            session.stream.stop().then((result:any) => {
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendSdp(sessionId:string, sdp:any){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            session.stream.sendSDPOffer({ sdp: sdp }).then((result:any) => {
                const sdpResult = JSON.parse(result.exchangeResponse)
                resolve(sdpResult.sdp)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendChatSdp(sessionId:string, sdp:any){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            session.stream.sendChatSDPOffer({ sdp: sdp }).then((result:any) => {
                const sdpResult = JSON.parse(result.exchangeResponse)
                resolve(sdpResult.sdp)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendIce(sessionId:string, ice:any){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            session.stream.sendIceCandidates(ice).then((result:any) => {
                const iceResult = JSON.parse(result.exchangeResponse)
                resolve(iceResult)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendKeepalive(sessionId:string){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            session.stream.sendKeepalive().then((result) => {
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    monitorSession(sessionId){
        setTimeout(() => {
            this._application.log('StreamManager', 'monitorSession('+sessionId+') checking state')

            const session = this.getSession(sessionId)
            if(session === undefined){
                this._application.log('StreamManager', 'monitorSession('+sessionId+') session not found')
                return
            }

            console.log('MONITORING SESSION:', session)
            session.stream.refreshState().then((state) => {
                if(state === 'Provisioned'){
                    session.playerState = 'started'

                } else if(state === 'ReadyToConnect'){
                    // Do MSAL Auth
                    this._application._authentication._xal.getMsalToken(this._application._authentication._tokenStore).then((msalToken) => {
                        console.log(msalToken)
                        // this.getApi(this.getSession(sessionId).type).sendMSALAuth(sessionId, msalToken.data.lpt).then(() => {
                        //     this.monitorSession(sessionId)

                        // }).catch((error) => {
                        //     console.log('MSAL AUTH Error:', error)
                        //     alert('MSAL AUTH Error:'+ error)
                        // })
                        // @TODO: Implement MSAL Auth
                    }).catch((error) => {
                        console.log('MSAL AUTH Error:', error)
                        alert('MSAL AUTH Error:'+ error)
                    })

                } else if(state === 'WaitingForResources'){
                    // Do Queue logic
                    if(session.waitingTimes === undefined){
                        console.log('Getting waiting times...:', session.waitingTimes)
                        // session.stream.getWaitingTimes(session.target).then((waitingTimes) => {
                        //     session.waitingTimes = waitingTimes
                        //     session.playerState = 'queued'

                        // })
                    }
                    
                    this.monitorSession(sessionId)

                } else if(state === 'Provisioning'){
                    // Lets loop again
                    this.monitorSession(sessionId)

                } else if(state === 'Failed'){
                    session.errorDetails = {
                        code: 'unknown',
                        message: 'unknown',
                    }
                    session.playerState = 'failed'

                } else {
                    console.log('Unknown state:', state)
                }

            }).catch((error) => {
                console.log('Streammanager - error checking state:', sessionId, error)

                if(error.status === 404){
                    this._application.log('StreamManager', 'Session not found on server. Removing session...')
                    delete this._sessions[sessionId]
                } else {
                    this.monitorSession(sessionId)
                }
            })
        }, 1000)
    }

    getActiveSessions(){
        return new Promise((resolve) => {
            // this.getApi('cloud').getActiveSessions().then((result) => {

            //     console.log('Active sessions:', result)
            //     resolve(result)
            // }).catch((error) => {
            //     reject(error)
            // })
            resolve([])
        })
    }
}