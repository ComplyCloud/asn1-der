import { Universal } from '@complyify/asn1';

const { Sequence } = Universal;

const sequencesAllTheWayDown = new Sequence([
  new Sequence([
    new Sequence([
      new Sequence([
        new Sequence([
          new Sequence([
            new Sequence([
              new Sequence([
                new Sequence([
                  new Sequence([
                    new Sequence([
                      new Sequence([
                        new Sequence(),
                      ]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),
]);

export default sequencesAllTheWayDown;
