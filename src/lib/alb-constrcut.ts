import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface ConstructorNameProps {
  stageName: string;
  acmArn: string;
  vpc: ec2.IVpc;
}

export class AlbConstruct extends cdk.Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly httpsListener: elbv2.ApplicationListener;
  public readonly albArn: cdk.CfnOutput;

  constructor(scope: cdk.Construct, id: string, props: ConstructorNameProps) {
    super(scope, id);

    // Create the load balancer in a VPC. 'internetFacing' is 'false'
    // by default, which creates an internal load balancer.
    this.alb = new elbv2.ApplicationLoadBalancer(this, `${envVars.PROJECT_NAME}-${props.stageName}-ALB`, {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: new ec2.SecurityGroup(this, `${envVars.PROJECT_NAME}-${props.stageName}-alb-sg`, {
        vpc: props.vpc,
        securityGroupName: `${envVars.PROJECT_NAME}-${props.stageName}-alb-sg`,
        description: `${envVars.PROJECT_NAME} ${props.stageName} ALB Security Group`,
        allowAllOutbound: true,
      }),
    });

    this.httpsListener = this.alb.addListener('https', {
      protocol: elbv2.ApplicationProtocol.HTTPS,
      port: 443,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Page not found',
      }),
    });

    this.httpsListener.addCertificates('Certificate',
      [acm.Certificate.fromCertificateArn(this, 'Certfication', props.acmArn)]);

    this.alb.addRedirect();

    this.albArn = new cdk.CfnOutput(this, 'AlbArn', { value: this.alb.loadBalancerArn, exportName: 'AlbArn' });
  }
}