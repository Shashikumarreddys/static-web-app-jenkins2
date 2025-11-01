pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPO = 'shashikumarrreddy/node-app-pipeline'
        DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
        GITHUB_CREDENTIALS = credentials('github-credentials')
        SONARQUBE_SERVER = 'SonarQube'
        SONAR_HOST_URL = 'http://localhost:9000'
        GITLEAKS_REPORT = 'gitleaks-report.json'
        TRIVY_REPORT = 'trivy-report.json'
        TARGET_HOST = credentials('target-host')
        TARGET_USER = 'ubuntu'
        TARGET_KEY = credentials('target-ssh-key')
        DEPLOY_PATH = '/opt/node-app-pipeline'
        BUILD_TAG = "${BUILD_NUMBER}"
        IMAGE_TAG = "${DOCKER_REGISTRY}/${DOCKER_REPO}:${BUILD_TAG}"
        LATEST_TAG = "${DOCKER_REGISTRY}/${DOCKER_REPO}:latest"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    echo "🔄 Checking out code from repository..."
                    checkout scm
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    echo "🏗️  Building Node.js application..."
                    sh '''
                        npm install || true
                        npm test -- --coverage --watchAll=false || true
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "🐳 Building Docker image..."
                    sh '''
                        docker build \
                            -t ${IMAGE_TAG} \
                            -t ${LATEST_TAG} \
                            -f Dockerfile .
                        
                        docker images | grep node-app-pipeline
                    '''
                }
            }
        }

        stage('Push to Docker Registry') {
            steps {
                script {
                    echo "📤 Pushing image to Docker registry..."
                    sh '''
                        echo "${DOCKER_CREDENTIALS_PSW}" | docker login -u "${DOCKER_CREDENTIALS_USR}" --password-stdin
                        
                        docker push ${IMAGE_TAG}
                        docker push ${LATEST_TAG}
                        
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Target Server') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "🚀 Deploying to target server..."
                    sh '''
                        mkdir -p ~/.ssh
                        echo "${TARGET_KEY}" > ~/.ssh/deploy_key
                        chmod 600 ~/.ssh/deploy_key
                        
                        SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ~/.ssh/deploy_key"
                        
                        scp ${SSH_OPTS} docker-compose.yml ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_PATH}/ || true
                        
                        ssh ${SSH_OPTS} ${TARGET_USER}@${TARGET_HOST} << 'EOF'
                            mkdir -p ${DEPLOY_PATH}
                            cd ${DEPLOY_PATH}
                            
                            export DOCKER_REGISTRY="${DOCKER_REGISTRY}"
                            export DOCKER_REPO="${DOCKER_REPO}"
                            export BUILD_NUMBER="${BUILD_NUMBER}"
                            
                            docker pull ${IMAGE_TAG}
                            docker-compose down || true
                            docker-compose up -d
                            docker-compose ps
                            
                            sleep 10
                            curl -s http://localhost:3000 || echo "Health check pending..."
EOF
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "📝 Pipeline execution completed"
                sh '''
                    rm -f ~/.ssh/deploy_key || true
                    docker logout || true
                '''
            }
        }

        success {
            echo "✅ Pipeline succeeded!"
        }

        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
