import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';
import { AlbConstruct } from './alb-constrcut';
import { EcsFargateCicd } from './ecs-fargate-cicd';
import { VpcConstruct } from './vpc-construct';

export interface InfraStackProps extends cdk.StackProps {

}

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const vpcInfo = new VpcConstruct(this, 'VPC', { stageName: 'dev' } );

    const albInfo = new AlbConstruct(this, 'ALB', { stageName: 'dev', acmArn: envVars.ACM_ARN, vpc: vpcInfo.vpc });

    const ecsCluster = new ecs.Cluster(this, 'CLUSTER', {
      clusterName: `${envVars.PROJECT_NAME}-ecs-cluster`,
      vpc: vpcInfo.vpc,
    });

    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      roleName: 'EcsTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // define resources here...
    envVars.SERVICES.forEach(service => {
      new EcsFargateCicd(this, `${service.APP_NAME}-EcsFargateWithCicd`, {
        //albArn: service.ALB_ARN,
        //vpcId: service.VPC_ID,
        ecsCluster: ecsCluster,
        vpc: vpcInfo.vpc,
        alb: albInfo.alb,
        priority: service.PRIORITY,
        token: service.GITHUB_TOKEN,
        appName: service.APP_NAME,
        githubOwner: service.REPO_OWNER,
        githubRepo: service.REPO_NAME,
        githubBranch: service.BUILD_BRANCH,
        listenerConditions: {
          hostHeaders: service.CONDITION.HOST_HEADER,
          pathPatterns: service.CONDITION.PATH_PATTERN,
          sourceIps: service.CONDITION.SOURCE_IP,
          queryString: service.CONDITION.QUERY_STRING,
        },
        httpsListener: albInfo.httpsListener,
        taskExecutionRole: taskExecutionRole,
      });
    });
  }
}