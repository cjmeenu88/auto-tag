import AutotagDefaultWorker from "./autotag_default_worker";
import AWS from "aws-sdk";
import co from "co";

class AutotagELBWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Add tag to elastic load balancer
  */
  tagResource() {
    let _this = this;
    return co(function*() {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.elb = new AWS.ELB({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagELBResource();
    });
  }

  tagELBResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.elb.describeTags(
          {
            LoadBalancerNames: [_this.getLoadBalancerName()]
          },
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              let tags = [];
              let tagArray = data.TagDescriptions[0].Tags;
              let assetTag = _this.checkTagExists(tagArray);

              if (!assetTag) {
                tags.push(_this.getAutotagPair());
              }

              _this.setTags(tags);
              resolve(true);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  setTags(tags) {
    let _this = this;
    try {
      _this.elb.addTags(
        {
          LoadBalancerNames: [_this.getLoadBalancerName()],
          Tags: tags
        },
        (err, res) => {
          if (err) {
            console.log(err);
          } else {
            console.log(res);
          }
        }
      );
    } catch (e) {
      console.log(e);
    }
  }

  getLoadBalancerName() {
    return this.event.requestParameters.loadBalancerName;
  }
};

export default AutotagELBWorker;
