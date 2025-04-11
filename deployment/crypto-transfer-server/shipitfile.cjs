// shipitfile.js

module.exports = (shipit) => {
  require("shipit-deploy")(shipit);

  const path = require("path");
  const util = require("util");
  const exec = util.promisify(require("child_process").exec);

  const rootPath = "./";
  const imageName = "crypto-transfer-server";
  const imageTag = "1.0.0";
  const imageTarfile = `docker-image-${imageName}-${imageTag}.tar`;
  const remotePath = "/app/srv/crypto-transfer-server";

  // const rootPath = "./";
  // const imageName = "crypto-transfer-server";
  // const imageTag = "2.0.0";
  // const imageTarfile = `docker-image-${imageName}-${imageTag}.tar`;
  // const remotePath = "/app/srv/crypto-transfer-server-v2";

  shipit.initConfig({
    default: {
      key: "./deployment/keys/snapx_pro_rsa",
      servers: "app@ec2-18-142-44-209.ap-southeast-1.compute.amazonaws.com",
    },
    development: {
      key: "./deployment/keys/snapx_pro_rsa",
      servers: "app@ec2-18-142-44-209.ap-southeast-1.compute.amazonaws.com",
    },
    production: {
      key: "./deployment/keys/id_rsa_egzz_app",
      servers: "app@8.218.197.222",
    },
    // Other environments (staging, etc.)
  });

  async function logging(text) {
    console.log(`\n${text}\n`);
  }

  shipit.blTask("build", async () => {
    await logging("开始构建docker镜像");
    await shipit.local(
      `docker build -t ${imageName}:${imageTag} --platform linux/amd64 -f Dockerfile .`,
      { cwd: rootPath }
    );
    await logging("完成构建");
  });

  shipit.blTask("dump", async () => {
    await logging("保存docker镜像为.tar文件");
    await shipit.local(
      `docker save ${imageName}:${imageTag} > ${imageTarfile}`
    );
    await logging("完成导出");
  });

  shipit.blTask("deploy", async () => {
    await logging("上传docker镜像到目标服务器");
    await shipit.remoteCopy(imageTarfile, remotePath);
    await logging("目标服务器加载docker镜像");
    await shipit.remote(`docker load < ${path.join(remotePath, imageTarfile)}`);
    await logging("完成远程加载");
  });

  shipit.blTask("restart", async () => {
    await logging("开始重启服务");
    await shipit.remote(`cd ${remotePath} && ./restart.sh`);
    await logging("完成重启服务");
  });

  shipit.blTask("clean", async () => {
    await logging("删除本地导出镜像");
    await exec(`rm ./${imageTarfile}`);
    await logging("删除上传到目标服务器镜像");
    await shipit.remote(`cd ${remotePath} && rm ./${imageTarfile}`);
    await logging("完成构建文件清除");
  });

  shipit.blTask("all", () => {
    shipit.start("build", "dump", "deploy", "restart", "clean");
  });

  // Other tasks...
};
