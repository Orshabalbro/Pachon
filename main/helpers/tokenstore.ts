import { TokenStore } from 'xal-node'
import Store from 'electron-store'
import StreamingToken from 'xal-node/dist/lib/tokens/streamingtoken'

export default class AuthTokenStore extends TokenStore {

    private _store = new Store()

    private _xhomeToken: StreamingToken
    private _xcloudToken: StreamingToken

    load() {
        const tokens = this._store.get('user.tokenstore', '{}') as string
        this.loadJson(tokens)

        return true
    }

    save() {
        const data = JSON.stringify({
            userToken: this._userToken?.data,
            sisuToken: this._sisuToken?.data,
            jwtKeys: this._jwtKeys,
        })

        this._store.set('user.tokenstore', data)
    }

    clear() {
        this._store.delete('user.tokenstore')
        this._userToken = undefined
        this._sisuToken = undefined
        this._jwtKeys = undefined
    }

    setStreamingTokens(streamingTokens:{ xHomeToken: StreamingToken, xCloudToken: StreamingToken }) {
        this._xhomeToken = streamingTokens.xHomeToken
        this._xcloudToken = streamingTokens.xCloudToken
    }

    getBaseUrl(type:'xhome' | 'xcloud') {
        if(type === 'xcloud')
            return this._xcloudToken.getDefaultRegion().baseUri.substring(8)
        else
            return this._xhomeToken.getDefaultRegion().baseUri.substring(8)
    }

    getStreamingToken(type:'xhome' | 'xcloud') {
        if(type === 'xcloud')
            return this._xcloudToken
        else
            return this._xhomeToken
    }
}