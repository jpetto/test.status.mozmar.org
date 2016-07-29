import React, { Component } from 'react';
import jsyaml from 'js-yaml';

import logo from '../img/logo.png';

class GlobalStatus extends Component {
    statusToColor(status) {
        var result;

        switch(status) {
        case 'healthy':
            result = 'success';
            break;
        case 'warning':
            result = 'warning';
            break;
        case 'failed':
            result = 'danger';
            break;
        case 'pending':
            result = 'info';
            break;
        default:
            result = '';
            break;
        }

        return result;
    }

    render() {
        var className = 'alert alert-' + this.statusToColor(this.props.status);

        return (
            <div className={className} role="alert">
                {this.props.message}
            </div>
        );
    }
}

class Service extends Component {
    getBadge() {
        var status = this.props.status;
        var glyphicon;

        switch(status) {
        case 'pending':
            glyphicon = 'question-sign';
            break;
        case 'warning':
            glyphicon = 'info-sign';
            break;
        case 'failed':
            glyphicon = 'remove-sign';
            break;
        default:
            glyphicon = 'ok-sign';
        }

        return (
            <span className={"badge mybadge " + this.props.status}>
                <span className={"glyphicon glyphicon-" + glyphicon} aria-hidden="true"></span>
            </span>
        );
    }

    getLink() {
        if (this.props.link === '') {
            return '';
        }

        return (
            <a href={this.props.link}>
                <span className="glyphicon glyphicon-link" aria-hidden="true"></span>
            </a>
        );
    }

    render() {
        return (
            <li className="list-group-item">
                {this.getBadge()}
                {this.props.name}
                &nbsp;
                {this.getLink()}
            </li>
        );
    }
}

class ServiceGroup extends Component {
    getServices() {
        var services = [];

        this.props.services.forEach(service => {
            if (!service.display) {
                return;
            }

            services.push(
                <Service
                   key={service.id}
                   status={service.status}
                   link={service.link}
                   name={service.name} />
            );
        });

        return services;
    }

    render() {
        var services = this.getServices();
        var header = null;

        if (this.props.name !== 'default') {
            header = (
                <li className="list-group-item list-group-item-info">
                    {this.props.name}
                </li>
            );
        }

        return (
            <ul className={"list-group"}>
                {header}
                {services}
            </ul>
        );
    }
}

class ServiceList extends Component {
    generateGroups() {
        var groups = {
            default: []
        };

        this.props.services.forEach(function(service) {
            if (!service.display) {
                return;
            }

            if (service.group) {
                if (Object.keys(groups).indexOf(service.group) >= 0) {
                    groups[service.group].push(service);
                } else {
                    groups[service.group] = [service];
                }
            } else {
                groups.default.push(service);
            }
        });

        return groups;
    }

    render() {
        var groups = this.generateGroups();
        var serviceGroups = [];

        for (var property in groups) {
            if (groups.hasOwnProperty(property)) {
                serviceGroups.push(
                    <ServiceGroup key={property} name={property} services={groups[property]} />
                );
            }
        }

        return (
            <div>
              {serviceGroups}
            </div>
        );
    }
}

class StatusBoard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            globalStatusMessage: 'Fetching data.',
            globalStatus: 'pending',
            services: [],
            lastUpdate: null
        };
    }

    updateStatus() {
        fetch('./status.yml').then(response => {
            if (response.ok) {
                response.text().then(text => {
                    this.updateStateFromYaml(text);
                });
            } else {
                console.error('status.yml response not ok :(');
            }
        }).catch((err) => {
            console.error('fetch error!');
            console.error(err);
        });
    }

    updateStateFromYaml(yaml) {
        var statusData = jsyaml.load(yaml);
        var services = Object.keys(statusData.components).map(key => {
            return statusData.components[key];
        });

        this.setState({
            globalStatus: statusData.globalStatus.status,
            globalStatusMessage: statusData.globalStatus.message,
            services: services,
            lastUpdate: new Date()
        });
    }

    componentDidMount() {
        this.updateStatus();
        setInterval(this.updateStatus.bind(this), 60000);
    }

    render() {
        // update favicon
        var favicon = document.getElementById('favicon');
        favicon.href = "/img/favicon-" + this.state.globalStatus + ".ico";

        // update last updated timestamp
        var lastUpdate = document.getElementById('last-update');
        lastUpdate.textContent = 'Last Update: ' + this.state.lastUpdate;

        return (
            <div>
              <GlobalStatus
                 message={this.state.globalStatusMessage}
                 status={this.state.globalStatus}/>
              <div id="logo">
                <a href="http://status.mozmar.org">
                  <img src={logo} />
                </a>
              </div>
              <ServiceList services={this.state.services} />
            </div>
        );
    }
}

export default StatusBoard;
