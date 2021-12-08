//import { Chalk } from 'chalk';

export const envVars = {
  REGION: process.env.REGION || 'ap-northeast-2',
  PROJECT_NAME: 'devrock',
  GIT_PROVIDER: 'github',
  //CERTIFICATE_ARN: '',
  ACM_ARN: 'arn:aws:acm:ap-northeast-2:074732449166:certificate/8fddc4d7-35b4-41fc-9072-b6074698920f',
  SERVICES: [
    {
      VPC_ID: '',
      APP_NAME: 'backend',
      REPO_OWNER: 'devrock-svc',
      REPO_NAME: 'videoend-back',
      BUILD_BRANCH: 'feature/odigage-admin',
      GITHUB_TOKEN: 'devrock/github/odigage',
      PRIORITY: 10,
      CONDITION: {
        HOST_HEADER: [],
        PATH_PATTERN: ['/v1/*'],
        SOURCE_IP: [],
        QUERY_STRING: [],
      },
      ALB_ARN: '',
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