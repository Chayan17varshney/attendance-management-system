export class userResponse {
  constructor(success, payload = {}, err = {}) {
    (this.success = success), (this.payload = payload), (this.err = err);
  }
}
