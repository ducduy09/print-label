class NetworkErrorManager {
  _defaultModal: any = null;
  register(_ref: any) {
    this._defaultModal = _ref;
  }
  unregister(_ref: any) {
    if (
      !!this._defaultModal &&
      this._defaultModal._id &&
      this._defaultModal._id === _ref._id
    ) {
      this._defaultModal = null;
    }
  }
  getDefault() {
    return this._defaultModal;
  }
}
export default new NetworkErrorManager();