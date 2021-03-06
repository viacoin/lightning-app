import * as log from './log';

class NavAction {
  constructor(store, ipcRenderer) {
    this._store = store;
    ipcRenderer.on('open-url', (event, arg) => {
      // TODO: Go to route
      log.info('open-url', arg);
    });
  }

  goHome() {
    this._store.route = 'Home';
  }

  goPay() {
    this._store.route = 'Pay';
  }

  goPayLightningConfirm() {
    this._store.route = 'PayLightningConfirm';
  }

  goPayBitcoin() {
    this._store.route = 'PayBitcoin';
  }

  goPayBitcoinConfirm() {
    this._store.route = 'PayBitcoinConfirm';
  }

  goInvoice() {
    this._store.route = 'Invoice';
  }

  goInvoiceQR() {
    this._store.route = 'InvoiceQR';
  }

  goChannels() {
    this._store.route = 'Channels';
  }

  goTransactions() {
    this._store.route = 'Transactions';
  }

  goTransaction() {
    this._store.route = 'Transaction';
  }

  goSettings() {
    this._store.route = 'Settings';
  }

  goCreateChannel() {
    this._store.route = 'CreateChannel';
  }

  goInitializeWallet() {
    this._store.route = 'InitializeWallet';
  }

  goVerifyWallet() {
    this._store.route = 'VerifyWallet';
  }

  goFundWallet() {
    this._store.route = 'FundWallet';
  }
}

export default NavAction;
