import { Fn } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BaseResource } from "./abstract/base-resouce";
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class SecretsManager extends BaseResource {
    constructor(scope: Construct, id: string,) {
        super();
        const sbcntrstgdbclusterarn = Fn.importValue('sbcntr-stg-dbcluster-arn');

        // シークレットの内容
        const secretContent = {
            username: 'sbcntruser',
            password: 'sbcntrEncP',
            engine: 'aurora-mysql',
            host: sbcntrstgdbclusterarn, // TODO ARNではなくデータベース名指定に変更
            port: 3306, // Aurora MySQLのポート番号
            dbname: 'sbcntrapp', // データベース名
        };

        // RDSシークレットの作成
        const rdsSecret = new secretsmanager.Secret(scope, 'RDSSecret', {
            secretName: 'sbcntr/mysql',
            secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify(secretContent)),
        });

        // シークレットの情報を出力
        new cdk.CfnOutput(scope, 'SecretArn', {
            value: rdsSecret.secretArn,
            exportName: 'RDSSecret-sbcntr-mysql'
        });
    }
}