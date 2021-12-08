import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as wafv2 from '@aws-cdk/aws-wafv2';
import * as cdk from '@aws-cdk/core';
import { envVars } from '../config';

export interface WafV2Props {
  stage: string;
  alb: elbv2.ApplicationLoadBalancer;
}
export class WafV2Construct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: WafV2Props) {
    super(scope, id);

    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      defaultAction: { allow: {} },
      name: `${envVars.PROJECT_NAME}-${props.stage}-waf-web-acl`,
      rules: [
        {
          priority: 1,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
          },
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
        },
        {
          priority: 2,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
          },
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
        },
        {
          priority: 3,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          },
          name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
        },
        {
          priority: 4,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesLinuxRuleSet',
          },
          name: 'AWS-AWSManagedRulesLinuxRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesLinuxRuleSet',
            },
          },
        },
        {
          priority: 5,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesAmazonIpReputationList',
          },
          name: 'AWS-AWSManagedRulesAmazonIpReputationList',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
        },
        {
          priority: 6,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesAnonymousIpList',
          },
          name: 'AWS-AWSManagedRulesAnonymousIpList',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAnonymousIpList',
            },
          },
        },
        {
          // eslint-disable-next-line quote-props
          'priority': 7,
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesBotControlRuleSet',
          },
          name: 'AWS-AWSManagedRulesBotControlRuleSet',
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesBotControlRuleSet',
            },
          },
        },
      ],
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${envVars.PROJECT_NAME}-${props.stage}-waf-web-acl`,
        sampledRequestsEnabled: true,
      },
    });

    const webAclAssoc = new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: props.alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });
    webAclAssoc.addDependsOn(webAcl);


  }
}