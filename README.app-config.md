1. [Overview](#overview)
2. [Installations](#installations)
   1. [Node](#node)
   2. [Git and project source files](#git-and-project-source-files)
   3. [Start Next.js App](#start-nextjs-app)
   4. [Configure SSH Access](#configure-ssh-access)
   5. [Confirm project is running](#confirm-project-is-running)
3. [Next Steps](#next-steps)
   1. [Reconfigure AWS Load Balancer](#reconfigure-aws-load-balancer)
   2. [Prep the Web App for Production](#prep-the-web-app-for-production)
4. [Troubleshooting](#troubleshooting)
   1. [Use Node Version Manager](#use-node-version-manager)
   2. [NODE\_MODULE\_VERSION errors](#node_module_version-errors)
# Overview
This markdown describes how to configure a brand new EC2 instance from scratch. An easier path when creating AWS EC2 instances is to use an AMI for a working EC2 instance

# Installations

## Node 

```bash
sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
. ~/.bashrc
nvm --version
nvm install node 
nvm alias default node
sudo yum install gcc
sudo yum install libatomic1   
node -v                       <--v25.2.1
npm -v                        <--11.6.2
```
## Git and project source files
SSH access is assumed. See the SSH setup instructions further below.

```bash
sudo yum install git
mkdir projects
cd projects
mkdir kbg-familysocial
git init
git remote add origin git@github.com/greg1951/kbg-nextjs-authjs-template.git
git branch -m main
git fetch && git checkout main
git branch develop
git checkout develop
npm install node
```
## Start Next.js App
Start the app in the `kbg-familysocial` project directory.

```bash
npm run dev 
```

## Configure SSH Access
**Create the key**
1. Create and go to ~/ssh-keys directory
2. Run command below to create key pairs
```bash
ssh-keygen -t ed25519 -C "gamemaster@knotboardgames.com"
<enter key file name, e.g. `kbg-ssh-key`>
<enter passphrase, e.g. `password`>
```
3. Run command below to create identity for the ssh key
```bash
ssh-keygen -t ed25519 -C "gamemaster@knotboardgames.com"
<confirm fingerprint>
```
4. Run command and copy contents of public key to clipboard: `vi kbg-ssh-key.pub`.

**Update GitHub**
These steps only need to be done once. If configured in one Linux and you need it in another (without using AMIs), they copy the ~/ssh-keys directory to the new Linux and update the ~/.ssh files.

1. Make sure you've added `gamemaster@knotboardgames.com` to the GitHub project emails. 
2. Login to GitHub, go to `Settings...SSH and GPG keys...New SSH key`. 
3. Assign name and paste in contents of public key and save.

![](/docs/github-ssh-keys.png)

## Confirm project is running
In a separate SSH session, run the following to confirm the application is running on port 3000.

```bash
ps aux |grep node             <-- Confirm node running 
netstat -tulpn |grep 'LISTEN' <-- Confirm LISTEN on 3000
```

# Next Steps

## Reconfigure AWS Load Balancer

The AWS load balancer will be reconfigured to reference port 3000 and the running application started here. [Find those instructions here to reconfigure the Load Balancer.](./README-Configure-Kbg-Aws.md#reconfigure-the-load-balancer) 

## Prep the Web App for Production
1. In an EC2 console follow the steps below in the `~/projects/kbg-familysocial` directory.

```bash
npm run build
npm run start
// Test the app
<ctl-c>
```

2. Run vi editor to create a service file: `sudo vi /etc/systemd/system/kbg-familysocial.service`

3. Copy and paste lines below into the above file and save.

```bash
[Unit]
Description=Next.js App
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/projects/kbg-familysocial
# Use the appropriate command for your package manager (npm, yarn, or pnpm)
ExecStart=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/node /home/ec2-user/projects/kbg-familysocial/node_modules/next/dist/bin/next start
# ExecStart=/usr/bin/bash -c 'PORT=3000 npm run start'
Restart=on-failure
Environment="NODE_ENV=production"
[Install]
WantedBy=default.target
```

4. Run the following commands to start/enable the service

```bash
sudo systemctl daemon-reload
sudo systemctl start kbg-familysocial.service
sudo systemctl enable kbg-familysocial.service
sudo systemctl status kbg-familysocial.service
```

5. Should there be an issue, run the following command to see the service journal.

```bash
sudo journalctl -u kbg-familysocial.service -f
sudo systemctl stop kbg-familysocial.service
```

# Troubleshooting

## Use Node Version Manager
If you need to switch between different versions of Node.js (but try to stay at the [latest version](https://nodejs.org/en/about/previous-releases)), then use `nvm` to do this.

**To see the installed and available versions**:
```bash
nvm ls
```

**To switch Node version**:
```bash
nvm use 25.2.1
```


## NODE_MODULE_VERSION errors
For a while I was getting NODE_MODULE_VERSION errors, on better-sqlite3 module but it was due to the way application was being started. 

```bash
Error: The module '/home/ec2-user/projects/kbg-familysocial/node_modules/better-sqlite3/build/Release/better_sqlite3.node' was compiled against a different Node.js version using 
NODE_MODULE_VERSION 137. 

This version of Node.js requires NODE_MODULE_VERSION 141. Please try re-compiling or re-installing the module (for instance, using `npm rebuild` or `npm install`).
```
NODE_MODULE_VERSION 137 is not an easy version # to find anywhere.

1. The kbg-familysocial.service was being started from the project directory and not within the project node_modules directory.
2. Change into the node directory inside of node_modules and run the following command.
```bash
  node -p process.versions.modules
```

  The command response was **137**. 
   
3. Change the `ExecStart` line in the process service to run node from there rather than the project node directory: `sudo vi /etc/systemd/system/kbg-familysocial.service`

**Change from**: 
```bash
ExecStart=/home/ec2-user/.nvm/versions/node/v25.2.1/bin/node /home/ec2-user/projects/kbg-familysocial/node_modules/next/dist/bin/next start
```

**Change to**:
```bash
ExecStart=/home/ec2-user/projects/kbg-familysocial/node_modules/node/bin/node /home/ec2-user/projects/kbg-familysocial/node_modules/next/dist/bin/next start
```

