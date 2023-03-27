
import groovy.json.JsonSlurper

def call(body) {
	def config = [:]
	body.resolveStrategy = Closure.DELEGATE_FIRST
	body.delegate = config
	body()

    sh """#!/bin/bash -e
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "\$NVM_DIR/bash_completion" ] && . "\$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    nvm i 10
    nvm alias default 10
    """

    build_env="${WORKSPACE}/.tmp/build_env.bash"
    env.BASH_ENV="${build_env}"
    env.TEMP="${WORKSPACE}/.tmp"

    sh "rm -rf .tmp sfcc && mkdir -p .tmp 2>/dev/null"

    dir("src") {
        env.BRANCH=readSh("git show -s --pretty=%D HEAD | cut -d ',' -f2 | tr -d ' ' | cut -d '/' -f2 | tr -d '\n' | sed 's/tag://g'")
        stage("Initialize source folder and run tests") {
            if (env.SSH_KEY && env.SSH_KEY != "") {
                withCredentials([sshUserPrivateKey(credentialsId: "${SSH_KEY}", keyFileVariable: "sshKey")]) {
                    sh """#!/bin/bash -e
                        eval \$(ssh-agent -s)
                        cp ${sshKey} ~/.ssh/id_rsa
                        chmod 600 ~/.ssh/id_rsa
                        ssh-add ~/.ssh/id_rsa
                        source ~/.nvm/nvm.sh
                        if [ -f .build/setup-environment.sh ] ; then
                            .build/setup-environment.sh \${BASH_ENV}
                        fi
                        echo "export ARTIFACTS_PATH=${WORKSPACE}/artifacts" >> \${BASH_ENV}
                        rm -f ${WORKSPACE}/artifacts/*
                        if [ -f ${WORKSPACE}/src/.build/post-checkout.sh ]; then
                            ${WORKSPACE}/src/.build/post-checkout.sh
                        fi
                    """.stripIndent()
                }
            }
        }
        stage("Build package") {
            sh """#!/bin/bash -e
                source ~/.nvm/nvm.sh
                source \${BASH_ENV}
                export BUILD_MODE="${env.BUILD_MODE}"
                export BUILD_POD="${env.BUILD_POD}"
                if [ -f ${WORKSPACE}/src/.build/build.sh ]; then
                    ${WORKSPACE}/src/.build/build.sh
                fi
            """
        }
    }
    archiveArtifacts artifacts: "artifacts/*"
    if ((env.DEPLOY_ENVIRONMENT && env.DEPLOY_ENVIRONMENT != "")) {
        if (env.DEPLOY_ENVIRONMENTS_CERTS && env.DEPLOY_ENVIRONMENTS_CERTS != "") {
            withCredentials([file(credentialsId: "${DEPLOY_ENVIRONMENTS_CERTS}", variable: "deployCerts" )]) {
                sh """#!/bin/bash -e
                mkdir -p ${WORKSPACE}/sfcc/certs && cd ${WORKSPACE}/sfcc/certs
                unzip ${deployCerts}
                chmod 600 *
                """
            }
        }
        stage("Deploy to environments") {
            if (env.SFCC_CLIENT_CREDS && env.SFCC_CLIENT_CREDS != "") {
                withCredentials([usernamePassword(credentialsId: "${SFCC_CLIENT_CREDS}", usernameVariable:"SFCC_CLIENT_ID", passwordVariable: "SFCC_CLIENT_SECRET")]) {
                    sh """#!/bin/bash -e
                    echo "export SFCC_OAUTH_CLIENT_ID=\${SFCC_CLIENT_ID}" >> ${build_env}
                    echo "export SFCC_OAUTH_CLIENT_SECRET=\${SFCC_CLIENT_SECRET}" >> ${build_env}
                    """
                }
            }
            if (env.GITHUB_CREDS && env.GITHUB_CREDS != "") {
                withCredentials([usernamePassword(credentialsId: "${GITHUB_CREDS}", usernameVariable:"GITHUB_USER", passwordVariable: "GITHUB_TOKEN")]) {
                    sh """#!/bin/bash -e
                    echo "export GITHUB_USER=\${GITHUB_USER}" >> ${build_env}
                    echo "export GITHUB_TOKEN=\${GITHUB_TOKEN}" >> ${build_env}
                    """
                }
            }
            if (env.TEST_QUEUE_CREDS) {
                withCredentials([usernamePassword(credentialsId: "${TEST_QUEUE_CREDS}", usernameVariable:"TEST_QUEUE_USER", passwordVariable: "TEST_QUEUE_PASSWORD")]) {
                    sh """#!/bin/bash -e
                    echo "export TEST_QUEUE_USER=\${TEST_QUEUE_USER}" >> ${build_env}
                    echo "export TEST_QUEUE_PASSWORD=\${TEST_QUEUE_PASSWORD}" >> ${build_env}
                    """
                }
            }
            if (env.DEPLOY_TO && env.DEPLOY_TO != "") {
                sh """#!/bin/bash -e
                source ~/.nvm/nvm.sh
                source \${BASH_ENV}
                export BRANCH_OVERRIDE="${env.BRANCH_OVERRIDE ?: ""}"
                export DRY_RUN="${env.DRY_RUN ?: ""}"
                export DEBUG_DEPLOY="${env.DEBUG_DEPLOY ?: ""}"
                echo "Deploying to instance: ${env.DEPLOY_TO} ${env.DEPLOY_REGION ?: ""} ${env.DEPLOY_TYPE ?: ""} ${env.DEPLOY_CERTURL ?: ""}"
                ${WORKSPACE}/src/.build/deploy-instance.sh ${env.DEPLOY_TO} ${env.DEPLOY_REGION ?: ""} ${env.DEPLOY_TYPE ?: ""} ${env.DEPLOY_CERTURL ?: ""}
                """
            } else {
                sh """#!/bin/bash -e
                source ~/.nvm/nvm.sh
                source \${BASH_ENV}
                export BRANCH_OVERRIDE="${env.BRANCH_OVERRIDE ?: ""}"
                export DRY_RUN="${env.DRY_RUN ?: ""}"
                export DEBUG_DEPLOY="${env.DEBUG_DEPLOY ?: ""}"
                echo "Deploying branch"
                ${WORKSPACE}/src/.build/deploy-branch.sh
                """
            }
            if (env.RUN_TESTS ) {
                sh """#!/bin/bash -e
                source ~/.nvm/nvm.sh
                source \${BASH_ENV}
                ${WORKSPACE}/src/.build/run_tests-branch.sh
                """
            }
        }
    }
}

return this


def readSh(cmd) {
  echo "Running: ${cmd}"
  sh "${cmd} > jenkins-tmp"
  result = readFile('jenkins-tmp')
  sh 'rm jenkins-tmp'
  return result
}
