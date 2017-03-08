import _ from 'lodash'
import { GRPC } from 'redux-grpc-middleware'
import { actions as notificationActions } from 'lightning-notifications'

export const FETCH_ACCOUNT = 'ACCOUNTS/FETCH_ACCOUNT'
export const FETCH_BALANCES = 'ACCOUNTS/FETCH_BALANCES'
export const SET_BALANCES = 'ACCOUNTS/SET_BALANCES'
export const REQUEST_CHANNELS = 'ACCOUNTS/REQUEST_CHANNELS'
export const FETCH_CHANNELS = 'ACCOUNTS/FETCH_CHANNELS'
export const LIST_PEERS = 'ACCOUNTS/LIST_PEERS'
export const OPEN_CHANNEL = 'ACCOUNTS/OPEN_CHANNEL'
export const CONNECT_PEER = 'ACCOUNTS/CONNECT_PEER'

const initialState = {
  pubkey: '',
  isSynced: true,
  currency: 'satoshi',
  balances: {
    wallet: 0,
    channel: 0,
  },
  channels: [],
  loadingChannels: false,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_CHANNELS:
      return { ...state, loadingChannels: true }
    case FETCH_ACCOUNT:
      return { ...state, pubkey: action.pubkey, isSynced: action.isSynced }
    case SET_BALANCES:
      return { ...state, balances: { ...state.balances, ...action.balances } }
    case FETCH_CHANNELS:
      return { ...state, channels: action.channels, loadingChannels: false }
    default: return state
  }
}

export const actions = {
  fetchAccount: () => ({
    [GRPC]: {
      method: 'getInfo',
      types: FETCH_ACCOUNT,
      schema: account => ({
        pubkey: account.identity_pubkey,
        isSynced: account.synced_to_chain,
      }),
    },
  }),
  fetchBalances: () => (dispatch) => {
    Promise.all([
      dispatch({
        [GRPC]: {
          method: 'walletBalance',
          schema: wallet => ({
            wallet: wallet.balance * 1000000000, // To SAT
          }),
        },
      }),
      dispatch({
        [GRPC]: {
          method: 'channelBalance',
          schema: channel => ({
            channel: parseInt(channel.balance, 10),
          }),
        },
      }),
    ])
    .then((results) => {
      const account = _.reduce(results, _.extend)
      dispatch({
        type: SET_BALANCES,
        balances: {
          wallet: account.wallet,
          channel: account.channel,
        },
      })
    })
  },
  fetchChannels: () => ({
    [GRPC]: {
      method: 'listChannels',
      types: [REQUEST_CHANNELS, FETCH_CHANNELS],
      schema: data => ({
        channels: _.map(data.channels, channel => ({
          remotePubkey: channel.remote_pubkey,
          id: channel.chan_id,
          capacity: channel.capacity,
          localBalance: channel.local_balance,
          remoteBalance: channel.remote_balance,
          status: 'pending',
        })),
      }),
    },
  }),
  listPeers: () => ({
    [GRPC]: {
      method: 'listPeers',
      types: LIST_PEERS,
      schema: list => ({
        peers: list.peers || {},
      }),
    },
  }),
  openChannel: ({ pubkey, amount }) => ({
    [GRPC]: {
      method: 'openChannel',
      body: {
        node_pubkey_string: pubkey,
        local_funding_amount: amount,
        num_confs: 1,
      },
      types: OPEN_CHANNEL,
    },
  }),
  connectPeer: ({ host, pubkey }) => ({
    [GRPC]: {
      method: 'connectPeer',
      body: {
        addr: { host, pubkey },
      },
      types: CONNECT_PEER,
    },
  }),
  createChannel: ({ ip, amount }) => (dispatch) => {
    return new new Promise((resolve, reject) => {
      const [pubkey, host] = ip && ip.split('@')

      const rejectError = (err) => {
        dispatch(notificationActions.addNotification(err.message))
        reject(err.message)
      }

      dispatch(actions.listPeers())
        .then(({ peers }) => {
          const peer = _.find(peers, { pub_key: pubkey })

          if (peer) {
            dispatch(actions.openChannel({ pubkey, amount }))
              .then(resolve)
              .catch(rejectError)
          } else {
            dispatch(actions.connectPeer({ host, pubkey }))
              .then(() => {
                dispatch(actions.openChannel({ pubkey, amount }))
                  .then(resolve)
                  .catch(rejectError)
              })
              .catch(rejectError)
          }
        })
        .catch(rejectError)
    })()
  },
}

export const selectors = {
  getSyncedToChain: state => state.isSynced,
  getAccountPubkey: state => state.pubkey,
  getCurrency: state => state.currency,
  getAccountBalances: state => state.balances,
  getChannels: state => state.channels || [],
  getChannelsLoading: state => state.loadingChannels,
}