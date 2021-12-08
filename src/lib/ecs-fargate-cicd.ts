import * as path from 'path';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
//import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
//import { envVars } from '../config';

export interface IGithubInfo {
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
}

export interface IAlbListenerCondition {
  hostHeaders: string[];
  pathPatterns: string[];
  sourceIps: string[];
  queryString: string[];
}

export interface IEcsInfo {
  vpc?: ec2.IVpc;
  ecsCluster?: ecs.Cluster;
  taskExecutionRole?: iam.IRole;
}

export interface IAlbInfo {
  listnerCondition: IAlbListenerCondition;
  httpsListener: elbv2.ApplicationListener;
  alb?: elbv2.IApplicationLoadBalancer;
  priority: number;
}

export interface IEcsFargateCicdProps {
  stageName?: string;
  vpcId?: string;
  vpc?: ec2.IVpc;
  ecsCluster?: ecs.Cluster;
  albArn?: string;
  alb?: elbv2.IApplicationLoadBalancer;
  priority: number;
  appName: string;
  appEcrRepo?: string;
  acmArn?: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
  listenerConditions: IAlbListenerCondition;
  token: string;
  httpsListener: elbv2.ApplicationListener;
  taskExecutionRole?: iam.IRole;
}

export class EcsFargateCicd extends cdk.Construct {
  public readonly vpc: ec2.IVpc;
  public readonly cluster: ecs.Cluster;
  public readonly ecrImage: ecs.ContainerImage;
  public readonly listener: elbv2.ApplicationListener;
  public readonly containerName: string;
  public readonly ecrRepository: ecr.IRepository;

  constructor(scope: cdk.Construct, id: string, props: IEcsFargateCicdProps) {
    super(scope, id);

    if (props.vpc == undefined) {
      const natGatewayProvider = ec2.NatProvider.instance({
        instanceType: new ec2.InstanceType('t3.small'),
      });

      this.vpc = new ec2.Vpc(scope, 'Vpc', {
        natGatewayProvider,
        natGateways: 1,
        maxAzs: 2,
        subnetConfiguration: [
          {
            name: 'public',
            cidrMask: 24,
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            name: 'private',
            cidrMask: 21,
            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          },
        ],
      });
    } else {
      //this.vpc = ec2.Vpc.fromLookup(this, 'VPC', { vpcId: props.vpcId } );
      this.vpc = props.vpc;
    }

    if (props.ecsCluster == undefined ) {
      this.cluster = new ecs.Cluster(this, 'Cluster', {
        clusterName: `${props.appName}-ecs-cluster`,
        vpc: this.vpc,
      });
    } else {
      this.cluster = props.ecsCluster;
    }

    if (props.appEcrRepo != undefined) {
      this.ecrRepository = ecr.Repository.fromRepositoryName(this, `${props.appEcrRepo}`, props.appEcrRepo);
      this.ecrImage = ecs.ContainerImage.fromEcrRepository(this.ecrRepository);
    } else {
      this.ecrRepository = new ecr.Repository(this, `${props.appName}-ecr-repo`, {
        repositoryName: `${props.appName}-ecr-repo`,
      });
      this.ecrImage = new ecs.AssetImage( path.join(__dirname, '..', 'demo-app'));
    }

    const taskExecutionRole = (props.taskExecutionRole == undefined) ? new iam.Role(this, `${props.appName}-ecs-task-execution-role`, {
      roleName: `${props.appName}-ecs-task-execution-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    }) : props.taskExecutionRole;

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });


    const taskdef = new ecs.FargateTaskDefinition(this, `${props.appName}-fargate-taskdef`, {
      cpu: 1024,
      memoryLimitMiB: 2048,
      taskRole: taskExecutionRole,
    });

    taskdef.addToExecutionRolePolicy(executionRolePolicy);

    taskdef.addContainer(`${props.appName}-Container`, {
      image: this.ecrImage,
      containerName: `${props.appName}`,
      cpu: 1024,
      memoryLimitMiB: 2048,
      essential: true,
      environmentFiles: [
        //ecs.EnvironmentFile.fromAsset( path.join(__dirname, '../env', `${props.appName}-${props.stageName}.env` )),
      ],
      secrets: {
        // Retrieved from AWS Secrets Manager or AWS Systems Manager Parameter Store at container start-up.
        //DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      },
      portMappings: [{ containerPort: 8090 }],
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'ecs-logs' }),
    });

    if (props.alb == undefined ) {
      const alb = new elbv2.ApplicationLoadBalancer(this, `${props.appName}-ALB`, {
        vpc: this.vpc,
        internetFacing: true,
      });

      if (props.acmArn == undefined) {
        this.listener = alb.addListener('http', {
          protocol: elbv2.ApplicationProtocol.HTTP,
          defaultAction: elbv2.ListenerAction.fixedResponse(404, {
            contentType: 'text/plain',
            messageBody: 'Page not found',
          }),
        });

      } else {

        this.listener = alb.addListener('https', {
          protocol: elbv2.ApplicationProtocol.HTTPS,
          port: 443,
          defaultAction: elbv2.ListenerAction.fixedResponse(404, {
            contentType: 'text/plain',
            messageBody: 'Page not found',
          }),
        });

        this.listener.addCertificates('Certificate',
          [acm.Certificate.fromCertificateArn(this, 'Certfication', props.acmArn)]);

        alb.addRedirect({
          sourceProtocol: elbv2.ApplicationProtocol.HTTP,
          sourcePort: 80,
          targetProtocol: elbv2.ApplicationProtocol.HTTPS,
          targetPort: 443,
          open: true,
        });


      }

    } else {
      this.listener = props.httpsListener;
    }

    const service = new ecs.FargateService(this, `${props.appName}-ecs-service`, {
      cluster: this.cluster,
      taskDefinition: taskdef,
      desiredCount: 2,
      //circuitBreaker: { rollback: true },
      minHealthyPercent: 50,
    });

    const scaling = service.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 4 } );

    scaling.scaleOnCpuUtilization('CPUUtilizationScaleInOut', {
      targetUtilizationPercent: 20,
      scaleOutCooldown: cdk.Duration.seconds(60),
      scaleInCooldown: cdk.Duration.seconds(360),
    });

    this.listener.addTargets(`${props.appName}-Targetgroup`, {
      targetGroupName: `${props.appName}-targetgroup`,
      port: 80,
      /* conditions: [
        elbv2.ListenerCondition.hostHeaders(props.listenerConditions.hostHeaders),
        elbv2.ListenerCondition.pathPatterns(props.listenerConditions.pathPatterns),
        elbv2.ListenerCondition.sourceIps(props.listenerConditions.sourceIps),
      ], */
      conditions: this.addListenerRule(props.listenerConditions),
      priority: props.priority,
      targets: [service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(60),
      },
    });

    // ***PIPELINE CONSTRUCTS***
    this.containerName = props.appName;
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const oauthToken = cdk.SecretValue.secretsManager(props.token);

    // ECR - repo

    // CODEBUILD - project
    const buildProject = new codebuild.PipelineProject(this, `${props.appName}-CodeBuildPloject`, {
      buildSpec: this.createBuildSpec(),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        privileged: true,
      },
      environmentVariables: {
        REPOSITORY_URI: { value: this.ecrRepository.repositoryUri },
        CONTAINER_NAME: { value: this.containerName },
      },
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
    });
    this.ecrRepository.grantPullPush(buildProject.grantPrincipal);

    // ***PIPELINE ACTIONS***
    // Source Action
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'Github_Source',
      owner: props.githubOwner ?? 'jingood2',
      repo: props.githubRepo ?? 'demo-app',
      oauthToken: oauthToken,
      output: sourceOutput,
      branch: props.githubBranch ?? 'master',
    });

    // Build Action
    const codebuildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_DockerImage_ECR',
      input: sourceOutput,
      outputs: [buildOutput],
      project: buildProject,
    });

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve',
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployAction',
      service: service,
      input: buildOutput,
      //imageFile: new codepipeline.ArtifactPath(buildOutput, 'imagedefinitions.json'),
    });

    new codepipeline.Pipeline(this, `${this.containerName}-build-CodePipeline`, {
      pipelineName: `${props.appName}-ci-ecr-pipeline`,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [codebuildAction],
        },
        {
          stageName: 'Approval',
          actions: [manualApprovalAction],
        },
        {
          stageName: 'DeploytoECS',
          actions: [deployAction],
        },
      ],
    });

  }

  private createBuildSpec() : codebuild.BuildSpec {
    return codebuild.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        pre_build: {
          commands: [
            'aws --version',
            '$(aws ecr get-login --region ${AWS_DEFAULT_REGION} --no-include-email |  sed \'s|https://||\')',
            'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
            'IMAGE_TAG=${COMMIT_HASH:=latest}', // NOTE: parameter is unset, default is latest
            'echo $IMAGE_TAG',
          ],
        },
        build: {
          commands: [
            //'docker buildx build --platform linux/amd64 -t $REPOSITORY_URI:latest .',
            'chmod +x gradlew',
            './gradlew clean build',
            'docker build -t $REPOSITORY_URI:latest .',
            'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
          ],
        },

        post_build: {
          commands: [
            'echo Build completed on `date`',
            'echo Pushing the Docker images...',
            'docker push $REPOSITORY_URI:latest',
            'docker push $REPOSITORY_URI:$IMAGE_TAG',
            'echo Writing image definitions file...',
            'printf "[{\\"name\\":\\"${CONTAINER_NAME}\\",\\"imageUri\\":\\"${REPOSITORY_URI}:latest\\"}]" > imagedefinitions.json',
          ],
        },
      },
      artifacts: {
        files: ['imagedefinitions.json'],
      },
    });
  }

  private addListenerRule(listnerConditions: IAlbListenerCondition) : elbv2.ListenerCondition[] {

    var conditions : elbv2.ListenerCondition[] = [];

    if (listnerConditions.hostHeaders.length > 0) {
      conditions.push( elbv2.ListenerCondition.hostHeaders(listnerConditions.hostHeaders));
    }

    if (listnerConditions.pathPatterns.length > 0) {
      conditions.push( elbv2.ListenerCondition.pathPatterns(listnerConditions.pathPatterns));
    }

    if (listnerConditions.sourceIps.length > 0) {
      conditions.push( elbv2.ListenerCondition.sourceIps(listnerConditions.sourceIps));
    }

    return conditions;
  }
}