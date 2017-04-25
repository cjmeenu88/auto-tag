import AutotagDefaultWorker from "./autotag_default_worker";
import AWS from "aws-sdk";
import co from "co";

class AutotagRDSWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created RDS instance
  */

  tagResource() {
    let _this = this;
    return co(function*() {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.rds = new AWS.RDS({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagRDSResource();
    });
  }

  tagRDSResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.rds.listTagsForResource(
          {
            ResourceName: _this.getDbARN()
          },
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              let tags = [];
              let tagArray = data.TagList;
              let assetTag = _this.checkTagExists(tagArray);

              if (!assetTag) {
                tags.push(_this.getAutotagPair());
              }

              _this.addTag(tags);
              resolve(true);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  addTag(tags) {
    let _this = this;
    try {
      _this.rds.addTagsToResource(
        {
          ResourceName: _this.getDbARN(),
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

  /*
  ** getDbARN
  **
  ** Used to construct an ARN for the db instance
  ** http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Tagging.html#USER_Tagging.ARN
  ** arn format: arn:aws:rds:<region>:<account number>:<resourcetype>:<name>
  ** resourcetype = 'db' in this instance
  */

  getDbARN() {
    let arnComponents = ["arn", "aws", "rds"];
    arnComponents.push(this.event.awsRegion);
    arnComponents.push(this.event.recipientAccountId);
    arnComponents.push("db");
    arnComponents.push(this.event.responseElements.dBInstanceIdentifier);
    return arnComponents.join(":");
  }
};

export default AutotagRDSWorker;
