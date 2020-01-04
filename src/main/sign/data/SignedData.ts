import DigestAlgorithmIdentifier from './AlgorithmIdentifier';
import ContentInfo from './ContentInfo';
import DERObject from './DERObject';
import { arrayToDERSet, makeDERSequence, makeDERTaggedData } from './derUtil';

export default class SignedData implements DERObject {
	constructor(
		public version: number,
		public digestAlgorithms: DigestAlgorithmIdentifier[],
		public contentInfo: ContentInfo,
		public signerInfos: DERObject[],
		public certificates?: DERObject[],
		public crls?: DERObject[]
	) {}

	public toDER(): number[] {
		let r = [0x02, 0x01, this.version & 0xff]
			.concat(arrayToDERSet(this.digestAlgorithms))
			.concat(this.contentInfo.toDER());
		if (this.certificates && this.certificates.length) {
			const allCertsDER = arrayToDERSet(this.certificates);
			// IMPLICIT SET
			allCertsDER[0] = 0xa0;
			r = r.concat(allCertsDER);
		}
		if (this.crls) {
			r = r.concat(makeDERTaggedData(1, arrayToDERSet(this.crls)));
		}
		r = r.concat(arrayToDERSet(this.signerInfos));
		return makeDERSequence(r);
	}
}
