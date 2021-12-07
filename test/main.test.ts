import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { InfraStack } from '../src/lib/infra-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new InfraStack(app, 'testStack', { env: { account: '074732449166', region: 'ap-northeast-2' } });

  expect(stack).toHaveResource('AWS::IAM::Policy');
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});