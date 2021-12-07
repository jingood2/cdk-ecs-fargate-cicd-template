//import { Chalk } from 'chalk';

export const envVars = {
  REGION: process.env.REGION || 'ap-northeast-2',
  PROJECT_NAME: 'devrock',
  GIT_PROVIDER: 'github',
  //CERTIFICATE_ARN: '',
  ACM_ARN: 'arn:aws:acm:ap-northeast-2:074732449166:certificate/a3bb34ef-d314-4ab9-a1b0-0351c19439f1',
  SERVICES: [
    {
      VPC_ID: '',
      APP_NAME: 'demo',
      REPO_OWNER: 'jingood2',
      REPO_NAME: 'demo-app',
      BUILD_BRANCH: 'master',
      GITHUB_TOKEN: 'devrock/github/token',
      PRIORITY: 2000,
      CONDITION: {
        HOST_HEADER: [],
        PATH_PATTERN: ['/*'],
        SOURCE_IP: [],
        QUERY_STRING: [],
      },
      ALB_ARN: '',
    },
    {
      VPC_ID: '',
      APP_NAME: 'hello',
      REPO_OWNER: 'jingood2',
      REPO_NAME: 'hello-app',
      BUILD_BRANCH: 'master',
      GITHUB_TOKEN: 'devrock/github/token',
      PRIORITY: 300,
      CONDITION: {
        HOST_HEADER: [],
        PATH_PATTERN: ['/hello'],
        SOURCE_IP: [],
        QUERY_STRING: [],
      },
      ALB_ARN: '',
    },
    /* {
      VPC_ID: '',
      APP_NAME: 'backend',
      REPO_OWNER: 'devrock-svc',
      REPO_NAME: 'videoend-back',
      BUILD_BRANCH: 'main',
      GITHUB_TOKEN: 'devrock/github/odigage',
      PRIORITY: 10,
      CONDITION: {
        HOST_HEADER: [],
        PATH_PATTERN: ['/v1/*'],
        SOURCE_IP: [],
        QUERY_STRING: [],
      },
      ALB_ARN: '',
    }, */
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