//import { Chalk } from 'chalk';

export const envVars = {
  REGION: process.env.REGION || 'ap-northeast-2',
  PROJECT_NAME: 'devrock',
  GIT_PROVIDER: 'github',
  GITHUB_TOKEN: 'atcl/jingood2/github-token',
  //CERTIFICATE_ARN: '',
  APP: {
    NAME: process.env.APP_NAME || 'demo',
    REPO_NAME: process.env.REPO_NAME || 'demo-app',
    REPO_OWNER: process.env.REPO_OWNER || 'jingood2',
    BUILD_BRANCH: process.env.BUILD_BRANCH || 'master',
  },
  ECS_SERVICE_INFO: [
    {
      serviceName: '',
    },
  ],


};

export function validateEnvVariables() {
  for (let variable in envVars) {
    if (!envVars[variable as keyof typeof envVars]) {
      throw Error(
        `[app]: Environment variable ${variable} is not defined!`,
      );
    }
  }
}