import { App, Construct, Stack, StackProps } from '@aws-cdk/core';
import { validateEnvVariables } from './config';
import { EcsFargateCicd } from './lib/ecs-fargate-cicd';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    /*  const appName = new CfnParameter(this, 'AppName', {
      type: 'String',
      description: 'The Application name that you deploy',
      default: 'demo',
    });

    const owner = new CfnParameter(this, 'GithubOwner', {
      type: 'String',
      description: 'The name of Github owner',
      default: `${envVars.APP.REPO_OWNER}`,
    });

    const repo = new CfnParameter(this, 'GithubRepo', {
      type: 'String',
      description: 'The name of Github repository',
      default: `${envVars.APP.REPO_NAME}`,
    }).valueAsString; */

    /* const acmArn = new CfnParameter(this, 'AcmArn', {
      type: 'List<AWS::CertificateManager::Certificate::CertificateAuthorityArn>',
    }).valueAsList;
 */
    const vpcId = this.node.tryGetContext('vpcid');
    const appName = this.node.tryGetContext('appName');
    const githubOwner = this.node.tryGetContext('githubOwner');
    const githubRepo = this.node.tryGetContext('githubRepo');

    // define resources here...
    new EcsFargateCicd(this, 'CdkEcsFargateCicd', {
      vpcId: vpcId,
      appName: appName,
      githubOwner: githubOwner,
      githubRepo: githubRepo,
      githubBranch: 'master',
      acmArn: 'arn:aws:acm:ap-northeast-2:074732449166:certificate/a3bb34ef-d314-4ab9-a1b0-0351c19439f1',
    });
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

new MyStack(app, 'EcsFargateCiCd', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();