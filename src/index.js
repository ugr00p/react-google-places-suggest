/**
 * Created by quando on 10/3/17.
 * based from https://github.com/xuopled/react-google-places-suggest
 */

import React from "react"
import PropTypes from "prop-types"

class GooglePlacesSuggest extends React.PureComponent {
  state = {
    coordinate: null,
    googleMaps: null,
    focusedSuggestIndex: 0,
    selectedLabel: "",
    suggests: [],
  };

  componentWillMount() {
    this.updateSuggests(this.props.search)
  }

  componentWillReceiveProps(nextProps) {
    this.updateSuggests(nextProps.search)
  }

  handleSelectSuggest = (suggest) => {
    const {onSelectSuggest} = this.props

    this.geocodeSuggest(suggest.description, () => {
      this.setState({selectedLabel: suggest.description, suggests: []}, () => {
        onSelectSuggest(suggest, this.state.coordinate)
      })
    })
  };

  updateSuggests = (search) => {
    const {googleMaps, suggestTypes, suggestComponentRestrictions} = this.props
    const autocompleteService = new googleMaps.places.AutocompleteService()

    if (!search) {
      this.setState({suggests: []})
      return
    }

    autocompleteService.getPlacePredictions({
      input: search,
      types: suggestTypes,
      componentRestrictions: suggestComponentRestrictions,
    }, (googleSuggests) => {
      if (!googleSuggests) {
        this.setState({suggests: []})
        return
      }

      this.setState({
        focusedSuggestIndex: 0,
        suggests: googleSuggests,
      })
    })
  };

  geocodeSuggest = (suggestLabel, callback) => {
    const {googleMaps} = this.props
    const geocoder = new googleMaps.Geocoder()

    geocoder.geocode({address: suggestLabel}, (results, status) => {
      if (status === googleMaps.GeocoderStatus.OK) {
        const location = results[0].geometry.location
        const coordinate = {
          latitude: location.lat(),
          longitude: location.lng(),
          title: suggestLabel,
          formatted_address: results[0].formatted_address,
        }

        this.setState({coordinate}, callback)
      }
    })
  };

  handleKeyDown = (e) => {
    const {focusedSuggestIndex, suggests} = this.state

    if (suggests.length > 0) {
      if (e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault()
      }

      if (e.key === "Enter") {
        this.handleSelectSuggest(suggests[focusedSuggestIndex])
      } else if (e.key === "ArrowUp") {
        if (suggests.length > 0 && focusedSuggestIndex > 0) {
          this.focusSuggest(focusedSuggestIndex - 1)
        }
      } else if (e.key === "ArrowDown") {
        if (suggests.length > 0 && focusedSuggestIndex < suggests.length - 1) {
          this.focusSuggest(focusedSuggestIndex + 1)
        }
      }
    }
  };

  focusSuggest = (index) => this.setState({focusedSuggestIndex: index});

  renderNoResults = () => this.props.textNoResults && (
    <li className="placesSuggest_suggest">
      {this.props.textNoResults}
    </li>
  );

  renderDefaultSuggest = (suggest) => {
    const {description, structured_formatting} = suggest
    const firstMatchedString = structured_formatting.main_text_matched_substrings.shift()
    let labelParts = null

    if (firstMatchedString) {
      labelParts = {
        before: description.substr(0, firstMatchedString.offset),
        matched: description.substr(firstMatchedString.offset, firstMatchedString.length),
        after: description.substr(firstMatchedString.offset + firstMatchedString.length),
      }
    }

    return (
      <div>
        <span className="placesSuggest_suggestLabel">
          {labelParts ?
            <span>
              {labelParts.before.length > 0 ? <span>{labelParts.before}</span> : null}
              <span className="placesSuggest_suggestMatch">{labelParts.matched}</span>
              {labelParts.after.length > 0 ? <span>{labelParts.after}</span> : null}
            </span> : description
          }
        </span>
      </div>
    )
  };

  renderSuggest(suggest) {
    const {renderSuggest} = this.props
    return renderSuggest
      ? renderSuggest(suggest)
      : this.renderDefaultSuggest(suggest)
  }

  renderSuggests() {
    const {baseClassName, activeClassName} = this.props;
    const {focusedSuggestIndex, suggests} = this.state

    return (
      <ul className="placesSuggest_suggests">
        {suggests.length > 0 ?
          // eslint-disable-next-line
          suggests.map((suggest, key) => (<li
            key={key}
            className={`${baseClassName} ${focusedSuggestIndex === key && activeClassName}`}
            onClick={() => this.handleSelectSuggest(suggest)}
          >
            {this.renderSuggest(suggest)}
          </li>))
        : this.renderNoResults()
        }
      </ul>
    )
  }

  render() {
    const {selectedLabel} = this.state
    const {children, search} = this.props
    // eslint-disable-next-line
    return (<div className="placesSuggest" onKeyDown={this.handleKeyDown}>
      {children}
      {search && selectedLabel !== search && this.renderSuggests()}
    </div>)
  }
}

GooglePlacesSuggest.propTypes = {
  children: PropTypes.any.isRequired,
  googleMaps: PropTypes.object.isRequired,
  onSelectSuggest: PropTypes.func,
  renderSuggest: PropTypes.func,
  search: PropTypes.string,
  suggestTypes: PropTypes.array,
  suggestComponentRestrictions: PropTypes.object,
  textNoResults: PropTypes.string,
  baseClassName: PropTypes.string,
  activeClassName: PropTypes.string,
}

GooglePlacesSuggest.defaultProps = {
  onSelectSuggest: () => {},
  search: "",
  suggestTypes: [],
  suggestComponentRestrictions: {
    country: "au",
  },
  textNoResults: "No results",
  baseClassName: "placesSuggest_suggest",
  activeClassName: "placesSuggest_suggest-active",
}

export const geocodeReverse = (googleMaps, {location}, callback) => {
  const geocoder = new googleMaps.Geocoder()

  geocoder.geocode({location}, (results, status) => {
    if (status === googleMaps.GeocoderStatus.OK) {
      const {lat, lng} = results[0].geometry.location
      const coordinate = {
        latitude: lat(),
        longitude: lng(),
        title: results[0].formatted_address,
      }

      callback(coordinate)
    }
  })
}

export default GooglePlacesSuggest
