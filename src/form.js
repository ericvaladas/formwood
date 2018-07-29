import React from 'react';


class Form extends React.Component {
  constructor(props) {
    super(props);
    this.fields = {};
    this.invalidFields = {};
    this.state = {valid: true};
    this.handleSubmit = this.handleSubmit.bind(this);
    this.registerField = this.registerField.bind(this);
    this.unregisterField = this.unregisterField.bind(this);
  }

  validate() {
    return new Promise(resolve => {
      this.invalidFields = {};
      for (const fieldName in this.fields) {
        for (const field of this.fields[fieldName]) {
          if (field && !field.validate()) {
            this.invalidFields[fieldName] = field;
          }
        }
      }
      this.setState({
        valid: Object.keys(this.invalidFields).length === 0
      }, resolve);
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    return this.validate()
      .then(() => {
        if (this.props.onSubmit) {
          this.props.onSubmit({
            valid: this.state.valid,
            values: this.values(),
            invalidFields: this.invalidFields
          });
        }
      });
  }

  getField(fieldName) {
    const fields = this.fields[fieldName] || [];
    return fields.sort((a, b) => {
      return b.state.timestamp - a.state.timestamp;
    })[0];
  }

  getCheckboxValues(fieldName) {
    const fieldValues = [];
    for (const field of this.fields[fieldName]) {
      if (field.state.value && field.state.checked) {
        fieldValues.push(field.props.value || field.state.value);
      }
    }
    return fieldValues;
  }

  values() {
    const values = {};
    Object.keys(this.fields)
      .map(fieldName => this.getField(fieldName))
      .filter(field => field && !field.props.exclude)
      .forEach(field => {
        switch (field.state.type) {
          case 'checkbox': {
            const fieldValues = this.getCheckboxValues(field.name);
            if (fieldValues.length === 1) {
              values[field.name] = fieldValues[0];
            }
            else if (fieldValues.length > 1) {
              values[field.name] = fieldValues;
            }
            break;
          }
          default:
            if (field.state.value !== undefined) {
              values[field.name] = field.state.value;
            }
        }
      });
    return values;
  }

  addPropsToChildren(children) {
    if (!children || children.constructor === Function) {
      return children;
    }
    return React.Children.map(children, child => {
      if (child && child.props) {
        const props = {
          children: this.addPropsToChildren(child.props.children)
        };
        if (child.type.constructor === Function) {
          props.form = {
            registerField: this.registerField,
            unregisterField: this.unregisterField,
            initialValues: this.props.values,
            messages: this.props.messages
          };
        }
        child = React.cloneElement(child, props);
      }
      return child;
    });
  }

  registerField(field) {
    const name = field.name;
    if (!this.fields[name]) {
      this.fields[name] = [];
    }
    this.fields[name].push(field);
  }

  unregisterField(field) {
    const fields = this.fields[field.name];
    fields.splice(fields.indexOf(field), 1);
  }

  render() {
    const children = this.addPropsToChildren(this.props.children);
    const formProps = Object.assign({}, this.props);
    delete formProps.values;
    delete formProps.messages;

    return (
      <form {...formProps} onSubmit={this.handleSubmit}>
        {children}
      </form>
    );
  }
}

Form.defaultProps = {
  values: {},
  messages: {}
};

export default Form;

