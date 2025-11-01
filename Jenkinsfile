pipeline {
    agent any

    // Environment variables for the pipeline
    environment {
        // Docker Registry Configuration
        DOCKER_REGISTRY = credentials('docker-registry-url')  // e.g., 'docker.io'
        DOCKER_REPO = credentials('docker-repo-name')         // e.g., 'yourusername/secure-node-app'
        DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
        
        // GitHub Configuration
        GITHUB_CREDENTIALS = credentials('github-credentials')
        GIT_REPO_URL = credentials('git-repo-url')  // e.g., 'https://github.com/yourname/node-app-pipeline.git'
        
        // SonarQube Configuration
        SONARQUBE_SERVER = 'SonarQube'
        SONAR_HOST_URL = credentials('sonarqube-url')      // e.g., 'http://sonarqube:9000'
        SONAR_AUTH_TOKEN = credentials('sonarqube-token')
        
        // Gitleaks Configuration
        GITLEAKS_REPORT = 'gitleaks-report.json'
        
        // Trivy Configuration
        TRIVY_REPORT = 'trivy-report.json'
        
        // Deployment Configuration
        TARGET_HOST = credentials('target-host')           // e.g., '192.168.1.100'
        TARGET_USER = credentials('target-user')           // e.g., 'ubuntu'
        TARGET_KEY = credentials('target-ssh-key')         // SSH private key
        DEPLOY_PATH = '/opt/secure-node-app'
        
        // Build Variables
        BUILD_TAG = "${BUILD_NUMBER}"
        IMAGE_TAG = "${DOCKER_REGISTRY}/${DOCKER_REPO}:${BUILD_TAG}"
        LATEST_TAG = "${DOCKER_REGISTRY}/${DOCKER_REPO}:latest"
    }

    options {
        // Keep last 30 builds
        buildDiscarder(logRotator(numToKeepStr: '30'))
        // Timeout after 60 minutes
        timeout(time: 60, unit: 'MINUTES')
        // Disable concurrent builds
        disableConcurrentBuilds()
        // Add timestamps to console output
        timestamps()
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    echo "🔄 Checking out code from repository..."
                    git(
                        url: "${GIT_REPO_URL}",
                        branch: 'main',
                        credentialsId: 'github-credentials'
                    )
                }
            }
        }

        stage('Secret Scanning - Gitleaks') {
            steps {
                script {
                    echo "🔍 Running Gitleaks for secret detection..."
                    sh '''
                        # Install Gitleaks if not already present
                        if ! command -v gitleaks &> /dev/null; then
                            echo "Installing Gitleaks..."
                            curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/install.sh | sh -s -- -b /usr/local/bin
                        fi
                        
                        # Run Gitleaks scan
                        gitleaks detect --source . --report-path ${GITLEAKS_REPORT} --report-format json || true
                    '''
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    echo "🏗️  Building Node.js application..."
                    sh '''
                        # Install dependencies
                        npm install
                        
                        # Run tests
                        npm test -- --coverage --watchAll=false
                    '''
                }
            }
        }

        stage('Code Quality Analysis - SonarQube') {
            steps {
                script {
                    echo "📊 Running SonarQube code quality analysis..."
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            # Install SonarQube Scanner if not available
                            if ! command -v sonar-scanner &> /dev/null; then
                                echo "Installing SonarQube Scanner..."
                                curl -o /tmp/sonar-scanner.zip \
                                    https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.7.0.2747-linux.zip
                                unzip -q /tmp/sonar-scanner.zip -d /opt
                                ln -s /opt/sonar-scanner-4.7.0.2747-linux/bin/sonar-scanner /usr/local/bin/
                            fi
                            
                            sonar-scanner \
                                -Dsonar.projectKey=secure-node-app \
                                -Dsonar.projectName="Secure Node.js App" \
                                -Dsonar.sources=src \
                                -Dsonar.tests=tests \
                                -Dsonar.exclusions=node_modules/**,dist/**,build/** \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=${SONAR_AUTH_TOKEN}
                        '''
                    }
                }
            }
        }

        stage('Quality Gate Check') {
            steps {
                script {
                    echo "⏳ Waiting for SonarQube quality gate results..."
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
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
                        
                        # Verify image
                        docker images | grep secure-node-app
                    '''
                }
            }
        }

        stage('Container Vulnerability Scan - Trivy') {
            steps {
                script {
                    echo "🛡️  Scanning container image with Trivy..."
                    sh '''
                        # Install Trivy if not available
                        if ! command -v trivy &> /dev/null; then
                            echo "Installing Trivy..."
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                        fi
                        
                        # Run Trivy scan on image
                        trivy image \
                            --severity HIGH,CRITICAL \
                            --format json \
                            --output ${TRIVY_REPORT} \
                            ${IMAGE_TAG} || true
                        
                        # Display summary
                        echo "Trivy Scan Summary:"
                        trivy image --severity HIGH,CRITICAL ${IMAGE_TAG} || true
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
                branch 'main'  // Only deploy from main branch
            }
            steps {
                script {
                    echo "🚀 Deploying to target server..."
                    sh '''
                        # Create SSH key file from credentials
                        mkdir -p ~/.ssh
                        echo "${TARGET_KEY}" > ~/.ssh/deploy_key
                        chmod 600 ~/.ssh/deploy_key
                        
                        # SSH connection options
                        SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ~/.ssh/deploy_key"
                        
                        # Copy docker-compose file to target
                        scp ${SSH_OPTS} docker-compose.yml ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_PATH}/
                        
                        # Deploy on target server
                        ssh ${SSH_OPTS} ${TARGET_USER}@${TARGET_HOST} << EOF
                            cd ${DEPLOY_PATH}
                            
                            # Export environment variables
                            export DOCKER_REGISTRY="${DOCKER_REGISTRY}"
                            export DOCKER_REPO="${DOCKER_REPO}"
                            export BUILD_NUMBER="${BUILD_NUMBER}"
                            
                            # Pull latest image
                            docker pull ${IMAGE_TAG}
                            
                            # Stop and remove old containers
                            docker-compose down || true
                            
                            # Start new containers
                            docker-compose up -d
                            
                            # Verify deployment
                            docker-compose ps
                            
                            # Check health
                            sleep 10
                            curl -s http://localhost:3000/api/health || echo "Health check pending..."
EOF
                    '''
                }
            }
        }

        stage('Smoke Tests') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "✅ Running smoke tests on deployed application..."
                    sh '''
                        RETRIES=5
                        for i in $(seq 1 $RETRIES); do
                            echo "Attempt $i/$RETRIES..."
                            HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://${TARGET_HOST}:3000/api/health)
                            if [ "$HEALTH" = "200" ]; then
                                echo "✓ Health check passed"
                                curl -s http://${TARGET_HOST}:3000/api/data | head -20
                                exit 0
                            fi
                            sleep 5
                        done
                        echo "✗ Health check failed after $RETRIES attempts"
                        exit 1
                    '''
                }
            }
        }

        stage('Generate Reports') {
            steps {
                script {
                    echo "📋 Generating scan reports..."
                    sh '''
                        # Convert Gitleaks report to HTML if available
                        if [ -f ${GITLEAKS_REPORT} ]; then
                            echo "<h2>Gitleaks Scan Results</h2>" > gitleaks-report.html
                            cat ${GITLEAKS_REPORT} | head -50 >> gitleaks-report.html
                        fi
                        
                        # Convert Trivy report to HTML if available
                        if [ -f ${TRIVY_REPORT} ]; then
                            echo "<h2>Trivy Scan Results</h2>" > trivy-report.html
                            cat ${TRIVY_REPORT} | head -50 >> trivy-report.html
                        fi
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "📝 Pipeline execution completed"
                
                // Archive scan reports
                archiveArtifacts(
                    artifacts: '**/*-report.*',
                    allowEmptyArchive: true
                )
                
                // Clean up sensitive files
                sh '''
                    rm -f ~/.ssh/deploy_key
                    docker logout || true
                '''
            }
        }

        success {
            script {
                echo "✅ Pipeline succeeded!"
                // Add notification (email, Slack, etc.)
                // slackSend(message: "Build #${BUILD_NUMBER} succeeded")
            }
        }

        failure {
            script {
                echo "❌ Pipeline failed!"
                // Add notification
                // slackSend(message: "Build #${BUILD_NUMBER} failed")
            }
        }

        unstable {
            script {
                echo "⚠️  Pipeline is unstable"
            }
        }

        cleanup {
            script {
                echo "🧹 Cleaning up workspace..."
                cleanWs()
            }
        }
    }
}
