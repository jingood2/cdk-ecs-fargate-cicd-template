const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.134.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-ecs-fargate-cicd-template',

  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecr',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-wafv2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-codebuild',
    '@aws-cdk/aws-events-targets',
    '@aws-cdk/aws-codepipeline',
    '@aws-cdk/aws-codepipeline-actions',
    '@aws-cdk/aws-elasticloadbalancingv2',
    '@aws-cdk/aws-certificatemanager',
  ], /* Which AWS CDK modules (those that start with "@aws-cdk/") this app uses. */
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': true,
  },
  deps: [
    'chalk',
    'path',
  ], /* Runtime dependencies of this module. */
  // description: undefined,      /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],                 /* Build dependencies for this module. */
  // packageName: undefined,      /* The "name" in package.json. */
  // release: undefined,          /* Add release management to this project. */
});
project.synth();