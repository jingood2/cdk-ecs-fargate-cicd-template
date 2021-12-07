import { App, Construct, Stack, StackProps } from '@aws-cdk/core';
import { validateEnvVariables } from './config';
//import { AlbConstruct } from './lib/alb-constrcut';
//import { EcsFargateCicd } from './lib/ecs-fargate-cicd';
import { InfraStack } from './lib/infra-stack';
//import { VpcConstruct } from './lib/vpc-construct';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  //account: '074732449166',
  account: process.env.CDK_DEPLOY_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION,
};

validateEnvVariables();
const app = new App();

new InfraStack(app, 'Odigage-infra', { env: devEnv });

app.synth();