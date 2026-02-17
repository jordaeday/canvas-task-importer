import { requestUrl } from "obsidian";

async function getAllData(url, token) {
	let upcoming = await requestUrl(
		url + "/api/v1/users/self/upcoming_events" + "?access_token=" + token
	);
	let total = upcoming.json;
	let missing = await requestUrl(
		url +
			"/api/v1/users/self/missing_submissions" +
			"?access_token=" +
			token
	);

	total = total.concat(missing.json);

	return total;
}
// formats the data object so that an obsidian-friendly markdown file can be generated
async function generateOutput(url, token) {
	let output = "";
	const data = await getAllData(url, token);
	for (let assignment of data) {
		let date;
		if (assignment.name != undefined) {
			date = new Date(assignment.due_at);
			date =
				date.getFullYear() +
				"-" +
				("0" + (date.getMonth() + 1)).slice(-2) +
				"-" +
				("0" + date.getDate()).slice(-2);
			output += "- [ ] " + assignment.name + "[due:: " + date + "]";
		} else {
			if (assignment.assignment != undefined) {
				date = new Date(assignment.assignment.due_at);
				date =
					date.getFullYear() +
					"-" +
					("0" + (date.getMonth() + 1)).slice(-2) +
					"-" +
					("0" + date.getDate()).slice(-2);
				output +=
					" - [ ] " +
					assignment.assignment.name +
					" " +
					" [due:: " +
					date +
					"]";
			} else {
				date = new Date(assignment.start_at);
				date =
					date.getFullYear() +
					"-" +
					("0" + (date.getMonth() + 1)).slice(-2) +
					"-" +
					("0" + date.getDate()).slice(-2);
				output +=
					"- [ ] " + assignment.title + "[scheduled:: " + date + "]";
			}
		}

		output += "\n";
	}
	return output;
}
export { getAllData, generateOutput };
