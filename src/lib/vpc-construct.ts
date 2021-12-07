import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface VpcConstructProps {
  stageName: string;
}

export class VpcConstruct extends cdk.Construct {
  public readonly vpc: ec2.IVpc;
  public readonly vpcId: cdk.CfnOutput;

  constructor(scope: cdk.Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const natGatewayProvider = ec2.NatProvider.instance({
      instanceType: new ec2.InstanceType('t3.small'),
    });

    this.vpc = new ec2.Vpc(scope, `${envVars.PROJECT_NAME}-${props.stageName}-Vpc`, {
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
        {
          name: 'db',
          cidrMask: 24,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.vpcId = new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId, exportName: 'VpcId' });

  }
}