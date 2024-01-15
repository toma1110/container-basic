import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CodeStack } from "../lib/code-stack";

test("snapshot test", () => {
    const app = new cdk.App();
    const stack = new CodeStack(app, "MyTestStack");
    // スタックからテンプレート(JSON)を生成
    const template = Template.fromStack(stack).toJSON();

    // 生成したテンプレートとスナップショットが同じか検証
    expect(template).toMatchSnapshot();
});