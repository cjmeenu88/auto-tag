import AutotagDefaultWorker from "./autotag_default_worker";
import AWS from "aws-sdk";
import co from "co";

class AutotagEC2Worker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the ec2 instance
  */
  tagResource() {
    let _this = this;
    return co(function*() {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagEC2Resources([_this.getInstanceId()]);
    });
  }

  tagEC2Resources(resources) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.ec2.describeTags(
          {
            Filters: [
              {
                Name: "resource-id",
                Values: resources
              }
            ]
          },
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              let tags = [];
              let tagArray = data.Tags;
              let assetTag = _this.checkTagExists( tagArray );

              if (!assetTag) {
                tags.push(_this.getAutotagPair());
              }

              _this.addTag(resources, tags);
              resolve(true);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  addTag(resources, tags) {
    let _this = this;
    try {
      _this.ec2.createTags(
        {
          Resources: resources,
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

  getInstanceId() {
    return this.event.responseElements.instancesSet.items[0].instanceId;
  }
};

export default AutotagEC2Worker;
