import React from 'react';
import {
	View,
	StyleSheet,
	Text,
	KeyboardAvoidingView,
	TextInput,
	ImageBackground,
	Image,
	TouchableOpacity,
	Alert,
	Keyboard,
	Platform
} from 'react-native';
import { Constants, Location, Permissions } from 'expo';
import { formattedToday, capitalizeFirstLatter, getApiData } from './utils';

import apiKeys from './apikeys';

const options = {
	weekday: 'short',
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric'
};

import defaultImage from './assets/uvac.jpg'

const ipApi = 'http://api.ipstack.com/check';
const openWeatherApi = 'http://api.openweathermap.org/data/2.5/weather';
const googleImgApi = 'https://www.googleapis.com/customsearch/v1';


export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			locationName: 'Weather in your area',
			errorMessage: null,
			userSearch: null,
			today: new Date().toLocaleDateString('sr-Latn-RS', options),
			weatherIconSrc: null,
			weatherDesc: null,
			currentTemp: null,
			dataError: false,
			userIpData: {},
			imgUrl: 'https://scontent-sin6-2.cdninstagram.com/vp/04837b8add6b2149a69dd0d89f0e70b8/5CF09871/t51.2885-15/e35/51353012_249238765964593_114478685069351006_n.jpg?_nc_ht=scontent-sin6-2.cdninstagram.com'
		}
	}

	componentDidMount() {
		if (Platform.OS === 'android' && !Constants.isDevice) {
			this.setState({
				errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
			});
		} else {
			this._getLocationAsync();
		}

		this.interval = setInterval(() => {
			this.setState({
				today: new Date().toLocaleDateString('sr-Latn-RS', options)
			})
		}, 1000);
	}

	_getLocationAsync = async () => {
		let { status } = await Permissions.askAsync(Permissions.LOCATION);
		let locationService = await Location.hasServicesEnabledAsync();

		if (status !== 'granted' || !locationService) {
			const ipApiParams = {
				access_key: apiKeys.ipstack
			}

			getApiData(ipApi, ipApiParams)
				.then(data => {
					console.log('ipApi data', data)
					let { lat, lon } = data;
					this.onAppLoad(lat, lon);
				});
		}

		let location = await Location.getCurrentPositionAsync({});
		console.log('location data from device', location);
		let lat = location.coords.latitude;
		let lon = location.coords.longitude;
		this.onAppLoad(lat, lon);
	};

	showHideLoader = (loading) => {
		if (loading) {
			this.setState({
				loading: true
			});
		} else {
			this.setState({
				loading: false
			});
		}
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	onAppLoad = (lat, lon) => {
		const initialWeatherParams = {
			lat,
			lon,
			units: 'metric',
			mode: 'JSON',
			APPID: apiKeys.openWeather
		}

		getApiData(openWeatherApi, initialWeatherParams)
			.then(data => {
				console.log(data);
				let currentTemp = data.main.temp.toFixed(0);
				let icon = data.weather[0].icon;
				let desc = capitalizeFirstLatter(data.weather[0].description);
				this.setState({
					currentTemp,
					weatherIconSrc: `http://openweathermap.org/img/w/${icon}.png`,
					weatherDesc: desc
				});
			})
	}

	imageSearch = (city) => {
		const imageParams = {
			q: city,
			num: 1,
			imgSize: 'xlarge',
			searchType: 'image',
			key: apiKeys.googleSearch,
			cx: apiKeys.googleCx
		}

		getApiData(googleImgApi, imageParams)
			.then(data => {
				console.log('google podaci za sliku', data);
				let imgUrl = data.items[0].link;
				this.setState({
					imgUrl
				});
			})
	}

	onSearchSubmit = () => {
		const initialWeatherParams = {
			q: this.state.userSearch,
			units: 'metric',
			mode: 'JSON',
			APPID: apiKeys.openWeather
		}

		getApiData(openWeatherApi, initialWeatherParams)
			.then(data => {
				if (data.error) {
					Alert.alert(
						'Bad request',
						'There was on error with you request. Please try again!'
					)
				}

				let locationName = data.name;
				let currentTemp = data.main.temp.toFixed(0);
				let icon = data.weather[0].icon;
				let desc = capitalizeFirstLatter(data.weather[0].description);
				this.imageSearch(locationName);

				this.setState({
					locationName,
					currentTemp,
					weatherIconSrc: `http://openweathermap.org/img/w/${icon}.png`,
					weatherDesc: desc
				});

				Keyboard.dismiss();
			})
	}

	render() {
		const {
			errorMessage,
			imgUrl,
			weatherIconSrc,
			locationName,
			weatherDesc,
			currentTemp
		} = this.state;

		if (errorMessage) {
			return (
				<View style={styles.container}>
					<Text style={styles.name}>{errorMessage}</Text>
				</View>
			);
		}

		return (
			<ImageBackground
				source={{
					uri: imgUrl
				}}
				style={{ width: '100%', height: '100%' }}
			>
				<KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
					{
						weatherIconSrc &&
						<Image
							source={{ uri: weatherIconSrc }}
							style={{ width: 80, height: 80 }}
						/>
					}

					{
						locationName &&
						<Text style={styles.name}>{locationName}</Text>
					}

					{
						weatherDesc &&
						<Text style={styles.type}>{weatherDesc}</Text>
					}

					{
						currentTemp &&
						<Text style={styles.temp}>{currentTemp} °C</Text>
					}

					<TextInput
						style={styles.customInput}
						placeholder="Enter City Name"
						onChangeText={(text) => this.setState({
							userSearch: text
						})}
					/>

					<TouchableOpacity style={styles.btn} onPress={this.onSearchSubmit}>
						<Text style={styles.btnText}>Search</Text>
					</TouchableOpacity>

					<Text
						style={styles.updateTime}
					>
						{this.state.today}
					</Text>
				</KeyboardAvoidingView>
			</ImageBackground>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	name: {
		color: '#fff',
		fontSize: 22,
		marginBottom: 5,
	},
	type: {
		color: '#fff',
		fontSize: 18,
		marginBottom: 5,
	},
	temp: {
		color: '#fff',
		fontSize: 16,
		marginBottom: 5,
	},
	updateTime: {
		color: '#fff',
		fontSize: 14,
	},
	customInput: {
		color: '#fff',
		height: 35,
		width: 150,
		paddingLeft: 6,
		marginTop: 20,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#fff',
		borderRadius: 3
	},
	btn: {
		backgroundColor: '#fff',
		borderRadius: 3,
		paddingVertical: 7,
		paddingHorizontal: 15,
		marginBottom: 20
	},
	btnText: {
		color: '#000',
		fontSize: 18,
		fontWeight: 'bold'
	}
});
